"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { can } from "@/lib/permissions";
import { encrypt } from "@/lib/crypto";
import { buildTransporter, sendEmail } from "@/lib/email";

type Result<T = null> = { ok: true; data: T } | { ok: false; message: string };

export type ProviderDTO = {
  id: string;
  name: string;
  preset: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  hasPassword: boolean;
  isActive: boolean;
  maxPerHour: number | null;
  maxPerDay: number | null;
  batchSize: number;
  batchDelaySec: number;
  lastTestedAt: string | null;
  lastTestOk: boolean | null;
  lastError: string | null;
};

export type ProviderInput = {
  id?: string;
  name: string;
  preset: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password?: string;
  maxPerHour: number | null;
  maxPerDay: number | null;
  batchSize: number;
  batchDelaySec: number;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function requireAdmin() {
  const user = await requireUser();
  if (!can(user.role, "settings.manage"))
    throw new Error("Only owners and admins can manage integrations.");
  return user;
}

function toDTO(
  p: Awaited<ReturnType<typeof prisma.emailProvider.findFirstOrThrow>>
): ProviderDTO {
  return {
    id: p.id,
    name: p.name,
    preset: p.preset,
    host: p.host,
    port: p.port,
    secure: p.secure,
    username: p.username,
    hasPassword: Boolean(p.passwordEnc),
    isActive: p.isActive,
    maxPerHour: p.maxPerHour,
    maxPerDay: p.maxPerDay,
    batchSize: p.batchSize,
    batchDelaySec: p.batchDelaySec,
    lastTestedAt: p.lastTestedAt?.toISOString() ?? null,
    lastTestOk: p.lastTestOk,
    lastError: p.lastError,
  };
}

async function audit(
  actorId: string,
  action: string,
  entityId: string,
  details: object
) {
  await prisma.auditLog.create({
    data: { actorId, action, entityType: "EmailProvider", entityId, details },
  });
}

export async function listProviders(): Promise<Result<ProviderDTO[]>> {
  try {
    await requireAdmin();
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
  const rows = await prisma.emailProvider.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
  });
  return { ok: true, data: rows.map(toDTO) };
}

export async function saveProvider(
  input: ProviderInput
): Promise<Result<ProviderDTO>> {
  let user;
  try {
    user = await requireAdmin();
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  const name = input.name.trim();
  const host = input.host.trim().toLowerCase();
  const username = input.username.trim();
  const port = Number(input.port);
  const password = input.password ?? "";
  const toIntOrNull = (v: unknown) =>
    v === null || v === "" || v === undefined
      ? null
      : Math.max(1, Math.floor(Number(v)));

  if (!name) return { ok: false, message: "Give this connection a name." };
  if (!host || host.includes("yourdomain"))
    return { ok: false, message: "Enter your SMTP server host." };
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    return { ok: false, message: "Port must be between 1 and 65535." };
  if (!username) return { ok: false, message: "SMTP username is required." };
  if (!input.id && !password)
    return { ok: false, message: "SMTP password is required." };

  const batchSize = Math.max(1, Math.floor(Number(input.batchSize) || 1));
  const batchDelaySec = Math.max(
    0,
    Math.floor(Number(input.batchDelaySec) || 0)
  );

  const data = {
    name,
    preset: input.preset || "custom",
    host,
    port,
    secure: Boolean(input.secure),
    username,
    maxPerHour: toIntOrNull(input.maxPerHour),
    maxPerDay: toIntOrNull(input.maxPerDay),
    batchSize,
    batchDelaySec,
    ...(password
      ? { passwordEnc: encrypt(password), lastTestOk: null, lastError: null }
      : {}),
  };

  const saved = input.id
    ? await prisma.emailProvider.update({ where: { id: input.id }, data })
    : await prisma.emailProvider.create({
        data: {
          ...data,
          passwordEnc: encrypt(password),
          isActive: (await prisma.emailProvider.count()) === 0,
        },
      });

  await audit(
    user.id,
    input.id ? "integrations.email.update" : "integrations.email.create",
    saved.id,
    {
      name,
      host,
      port,
      passwordChanged: Boolean(password),
    }
  );

  return { ok: true, data: toDTO(saved) };
}

export async function deleteProvider(id: string): Promise<Result> {
  let user;
  try {
    user = await requireAdmin();
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  const p = await prisma.emailProvider.findUnique({ where: { id } });
  if (!p) return { ok: false, message: "Connection not found." };
  if (p.isActive)
    return {
      ok: false,
      message: "Activate another connection before deleting the active one.",
    };

  await prisma.emailProvider.delete({ where: { id } });
  await audit(user.id, "integrations.email.delete", id, { name: p.name });
  return { ok: true, data: null };
}

export async function activateProvider(id: string): Promise<Result> {
  let user;
  try {
    user = await requireAdmin();
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  const p = await prisma.emailProvider.findUnique({ where: { id } });
  if (!p) return { ok: false, message: "Connection not found." };

  await prisma.$transaction([
    prisma.emailProvider.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    }),
    prisma.emailProvider.update({ where: { id }, data: { isActive: true } }),
  ]);
  await audit(user.id, "integrations.email.activate", id, { name: p.name });
  return { ok: true, data: null };
}

export async function testProvider(id: string): Promise<Result<ProviderDTO>> {
  try {
    await requireAdmin();
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  const p = await prisma.emailProvider.findUnique({ where: { id } });
  if (!p) return { ok: false, message: "Connection not found." };

  let ok = false;
  let error: string | null = null;
  try {
    await buildTransporter(p).verify();
    ok = true;
  } catch (e) {
    error = (e as Error).message;
  }

  const updated = await prisma.emailProvider.update({
    where: { id },
    data: { lastTestedAt: new Date(), lastTestOk: ok, lastError: error },
  });
  return { ok: true, data: toDTO(updated) };
}

export async function sendTestEmail(to: string): Promise<Result<string>> {
  let user;
  try {
    user = await requireAdmin();
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  const email = to.trim().toLowerCase();
  if (!EMAIL.test(email))
    return { ok: false, message: "Enter a valid email address." };

  const result = await sendEmail({
    to: email,
    subject: "Test email from your Church CMS",
    text: `This is a test email sent by ${user.name} from Settings → Integrations.\n\nIf you're reading this, email sending works.`,
  });

  await audit(user.id, "integrations.email.test", "active", {
    to: email,
    ok: result.ok,
  });

  return result.ok
    ? {
        ok: true,
        data: `Test email sent to ${email}. Check the inbox and spam folder.`,
      }
    : { ok: false, message: `Sending failed: ${result.error}` };
}
