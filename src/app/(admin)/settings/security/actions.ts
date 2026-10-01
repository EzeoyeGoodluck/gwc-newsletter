"use server";

import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { can } from "@/lib/permissions";

type Result<T = null> = { ok: true; data: T } | { ok: false; message: string };

export type SessionDTO = {
  id: string;
  device: string;
  isMobile: boolean;
  ipAddress: string | null;
  lastActive: string;
  signedInAt: string;
  isCurrent: boolean;
};

export type SecurityOverview = {
  hasPassword: boolean;
  passwordChangedAt: string | null;
  sessions: SessionDTO[];
  canViewAudit: boolean;
};

function describeUserAgent(ua: string | null): {
  device: string;
  isMobile: boolean;
} {
  if (!ua) return { device: "Unknown device", isMobile: false };

  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Browser";

  const os = /iPhone/.test(ua)
    ? "iPhone"
    : /iPad/.test(ua)
      ? "iPad"
      : /Android/.test(ua)
        ? "Android"
        : /Windows/.test(ua)
          ? "Windows"
          : /Mac OS X|Macintosh/.test(ua)
            ? "macOS"
            : /Linux/.test(ua)
              ? "Linux"
              : "Unknown OS";

  return {
    device: `${browser} on ${os}`,
    isMobile: /iPhone|iPad|Android|Mobile/.test(ua),
  };
}

async function currentSessionId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.session.id ?? null;
}

export async function getSecurityOverview(): Promise<Result<SecurityOverview>> {
  const user = await requireUser();
  const currentId = await currentSessionId();

  const [account, sessions] = await Promise.all([
    prisma.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
      select: { password: true, updatedAt: true },
    }),
    prisma.session.findMany({
      where: { userId: user.id, expiresAt: { gt: new Date() } },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return {
    ok: true,
    data: {
      hasPassword: Boolean(account?.password),
      passwordChangedAt: account?.updatedAt.toISOString() ?? null,
      canViewAudit: can(user.role, "settings.manage"),
      sessions: sessions
        .map((s) => ({
          id: s.id,
          ...describeUserAgent(s.userAgent),
          ipAddress: s.ipAddress,
          lastActive: s.updatedAt.toISOString(),
          signedInAt: s.createdAt.toISOString(),
          isCurrent: s.id === currentId,
        }))
        .sort((a, b) => Number(b.isCurrent) - Number(a.isCurrent)),
    },
  };
}

export async function revokeSession(sessionId: string): Promise<Result> {
  const user = await requireUser();
  const currentId = await currentSessionId();

  if (sessionId === currentId) {
    return { ok: false, message: "Use Sign out to end your current session." };
  }

  const { count } = await prisma.session.deleteMany({
    where: { id: sessionId, userId: user.id },
  });
  if (count === 0)
    return { ok: false, message: "That session no longer exists." };

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "security.session.revoke",
      entityType: "Session",
      entityId: sessionId,
    },
  });
  return { ok: true, data: null };
}

export async function revokeOtherSessions(): Promise<Result<number>> {
  const user = await requireUser();
  const currentId = await currentSessionId();

  const { count } = await prisma.session.deleteMany({
    where: {
      userId: user.id,
      ...(currentId ? { id: { not: currentId } } : {}),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "security.session.revoke_others",
      entityType: "User",
      entityId: user.id,
      details: { revoked: count },
    },
  });
  return { ok: true, data: count };
}

export async function changePassword(formData: FormData): Promise<Result> {
  const user = await requireUser();

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const signOutOthers = formData.get("signOutOthers") === "on";

  if (!currentPassword)
    return { ok: false, message: "Enter your current password." };
  if (newPassword.length < 8)
    return {
      ok: false,
      message: "New password must be at least 8 characters.",
    };
  if (newPassword !== confirmPassword)
    return { ok: false, message: "New passwords do not match." };
  if (newPassword === currentPassword)
    return {
      ok: false,
      message: "Choose a password different from your current one.",
    };

  try {
    await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: signOutOthers,
      },
      headers: await headers(),
    });
  } catch (error) {
    const message =
      error instanceof APIError
        ? (error.body?.message ?? error.message)
        : "We couldn't change your password. Please try again.";
    return {
      ok: false,
      message: /invalid password/i.test(message)
        ? "Your current password is incorrect."
        : message,
    };
  }

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "security.password.change",
      entityType: "User",
      entityId: user.id,
      details: { signedOutOthers: signOutOthers },
    },
  });
  return { ok: true, data: null };
}
