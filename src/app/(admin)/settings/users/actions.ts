"use server";

import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { LABEL_TO_ROLE, RoleLabel, toLabel } from "@/lib/roles";
import { sendEmail } from "@/lib/email";
import { canManageRole } from "@/lib/permissions";

type Result<T = null> = { ok: true; data: T } | { ok: false; message: string };

const INVITE_DAYS = 7;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type TeamMemberDTO = {
  id: string;
  name: string;
  email: string;
  role: RoleLabel;
  lastActive: string | null;
  isYou: boolean;
};

export type InvitationDTO = {
  id: string;
  email: string;
  role: Exclude<RoleLabel, "Owner">;
  invitedBy: string;
  sentAt: string;
  link: string;
};

export type TeamData = {
  members: TeamMemberDTO[];
  invitations: InvitationDTO[];
  currentRole: RoleLabel;
};

function inviteLink(token: string) {
  const base = process.env.APP_URL || "http://localhost:3000";

  return `${base.replace(
    /\/$/,
    ""
  )}/accept-invite?token=${encodeURIComponent(token)}`;
}

async function requireManager() {
  const user = await requireUser();
  const role = user.role ?? "VIEWER";
  if (role !== "OWNER" && role !== "ADMIN") {
    throw new Error("Only owners and administrators can manage the team.");
  }
  return { ...user, role };
}

async function ownerCount() {
  return prisma.user.count({ where: { role: "OWNER" } });
}

export async function getTeam(): Promise<Result<TeamData>> {
  const me = await requireUser();

  const [users, lastSessions, invites] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true, role: true },
    }),
    prisma.session.groupBy({ by: ["userId"], _max: { updatedAt: true } }),
    prisma.invitation.findMany({
      where: { status: "PENDING", expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const nameById = new Map(users.map((u) => [u.id, u.name]));
  const lastById = new Map(
    lastSessions.map((s) => [s.userId, s._max.updatedAt])
  );

  return {
    ok: true,
    data: {
      currentRole: toLabel(me.role ?? "VIEWER"),
      members: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: toLabel(u.role),
        lastActive: lastById.get(u.id)?.toISOString() ?? null,
        isYou: u.id === me.id,
      })),
      invitations: invites.map((i) => ({
        id: i.id,
        email: i.email,
        role: toLabel(i.role) as Exclude<RoleLabel, "Owner">,
        invitedBy: (i.invitedById && nameById.get(i.invitedById)) || "Unknown",
        sentAt: i.createdAt.toISOString(),
        link: inviteLink(i.token),
      })),
    },
  };
}

export async function changeMemberRole(
  userId: string,
  label: RoleLabel
): Promise<Result> {
  let me;
  try {
    me = await requireManager();
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  const newRole = LABEL_TO_ROLE[label];
  if (!newRole) return { ok: false, message: "Unknown role." };
  if (userId === me.id)
    return { ok: false, message: "You can't change your own role." };

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, message: "Team member not found." };
  if (target.role === newRole) return { ok: true, data: null };

  const involvesOwner = target.role === "OWNER" || newRole === "OWNER";
  if (involvesOwner && me.role !== "OWNER") {
    return {
      ok: false,
      message: "Only an owner can grant or change owner access.",
    };
  }
  if (target.role === "OWNER" && (await ownerCount()) <= 1) {
    return { ok: false, message: "There must always be at least one owner." };
  }

  await prisma.user.update({ where: { id: userId }, data: { role: newRole } });
  await prisma.auditLog.create({
    data: {
      actorId: me.id,
      action: "team.role.change",
      entityType: "User",
      entityId: userId,
      details: { email: target.email, from: target.role, to: newRole },
    },
  });

  return { ok: true, data: null };
}

export async function removeTeamMember(userId: string): Promise<Result> {
  let me;
  try {
    me = await requireManager();
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  if (userId === me.id)
    return { ok: false, message: "You can't remove yourself." };

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, message: "Team member not found." };
  if (target.role === "OWNER" && me.role !== "OWNER") {
    return { ok: false, message: "Only an owner can remove another owner." };
  }
  if (target.role === "OWNER" && (await ownerCount()) <= 1) {
    return { ok: false, message: "You can't remove the last owner." };
  }

  await prisma.$transaction([
    prisma.auditLog.create({
      data: {
        actorId: me.id,
        action: "team.member.remove",
        entityType: "User",
        entityId: userId,
        details: { name: target.name, email: target.email, role: target.role },
      },
    }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  return { ok: true, data: null };
}

export async function createInvitation(
  email: string,
  label: Exclude<RoleLabel, "Owner">
): Promise<Result<{ link: string }>> {
  let me;
  try {
    me = await requireManager();
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  const clean = email.trim().toLowerCase();
  const role = LABEL_TO_ROLE[label];
  if (!EMAIL.test(clean))
    return { ok: false, message: "Enter a valid email address." };
  if (!role || !canManageRole(me.role, role)) {
    return { ok: false, message: "You can't invite someone with that role." };
  }

  if (await prisma.user.findUnique({ where: { email: clean } })) {
    return {
      ok: false,
      message: "That email already belongs to a team member.",
    };
  }

  const pending = await prisma.invitation.findFirst({
    where: { email: clean, status: "PENDING", expiresAt: { gt: new Date() } },
  });
  if (pending)
    return {
      ok: false,
      message: "An invitation for that email is already pending.",
    };

  const token = randomBytes(32).toString("base64url");
  const invite = await prisma.invitation.create({
    data: {
      email: clean,
      role,
      token,
      invitedById: me.id,
      expiresAt: new Date(Date.now() + INVITE_DAYS * 86_400_000),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: me.id,
      action: "team.invite.create",
      entityType: "Invitation",
      entityId: invite.id,
      details: { email: clean, role },
    },
  });

  const link = inviteLink(token);
  const settings = await prisma.churchSettings.findUnique({
    where: { id: "default" },
  });
  const churchName = settings?.name ?? "Glory Worship Church";

  void sendEmail({
    to: clean,
    subject: `You're invited to the ${churchName} CMS`,
    text: `Hi,\n\n${me.name} has invited you to join the ${churchName} CMS as ${label}.\n\nCreate your account here (the link expires in ${INVITE_DAYS} days):\n\n${link}\n\nIf you weren't expecting this, you can ignore this email.`,
  });

  return { ok: true, data: { link } };
}

export async function cancelInvitation(id: string): Promise<Result> {
  let me;
  try {
    me = await requireManager();
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  const invite = await prisma.invitation.findUnique({ where: { id } });
  if (!invite || invite.status !== "PENDING") {
    return { ok: false, message: "Invitation not found or already used." };
  }

  await prisma.invitation.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
  await prisma.auditLog.create({
    data: {
      actorId: me.id,
      action: "team.invite.cancel",
      entityType: "Invitation",
      entityId: id,
      details: { email: invite.email },
    },
  });

  return { ok: true, data: null };
}
