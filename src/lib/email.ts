import "server-only";
import nodemailer, { Transporter } from "nodemailer";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";

type SendEmailInput = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  headers?: Record<string, string>;
};

export type SendResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

type ProviderRow = NonNullable<
  Awaited<ReturnType<typeof prisma.emailProvider.findFirst>>
>;

let cached: { key: string; transporter: Transporter } | null = null;

export function buildTransporter(
  p: Pick<ProviderRow, "host" | "port" | "secure" | "username" | "passwordEnc">
) {
  return nodemailer.createTransport({
    host: p.host,
    port: p.port,
    secure: p.secure,
    auth: { user: p.username, pass: decrypt(p.passwordEnc) },
    connectionTimeout: 15_000,
  });
}

export async function getActiveProvider() {
  return prisma.emailProvider.findFirst({ where: { isActive: true } });
}

async function getTransporter() {
  const provider = await getActiveProvider();
  if (!provider) return null;

  const key = `${provider.id}:${provider.updatedAt.getTime()}`;
  if (cached?.key !== key) {
    cached = { key, transporter: buildTransporter(provider) };
  }
  return { provider, transporter: cached.transporter };
}

export async function senderIdentity(fallbackEmail?: string) {
  const s = await prisma.churchSettings.findUnique({
    where: { id: "default" },
  });
  const name = (s?.senderName || s?.name || "Church CMS").replace(/"/g, "");
  const email = s?.senderEmail || fallbackEmail || "";
  return { from: `"${name}" <${email}>`, replyTo: s?.replyTo || undefined };
}

export async function sendEmail(input: SendEmailInput): Promise<SendResult> {
  const active = await getTransporter();
  if (!active) {
    console.warn(
      `[email] No active email provider. Would send "${input.subject}" to ${input.to}`
    );
    return {
      ok: false,
      error: "No active email provider. Set one up in Settings → Integrations.",
    };
  }

  try {
    const { from, replyTo } = await senderIdentity(active.provider.username);
    const info = await active.transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo ?? replyTo,
      headers: input.headers,
    });
    return { ok: true, messageId: info.messageId };
  } catch (e) {
    console.error("[email] send failed:", e);
    return { ok: false, error: (e as Error).message };
  }
}

export async function getSendingLimits() {
  const p = await getActiveProvider();
  if (!p) return null;
  return {
    providerId: p.id,
    maxPerHour: p.maxPerHour,
    maxPerDay: p.maxPerDay,
    batchSize: p.batchSize,
    batchDelaySec: p.batchDelaySec,
  };
}
