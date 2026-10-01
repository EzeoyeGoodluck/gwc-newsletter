"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { can } from "@/lib/permissions";

type Result = { ok: true } | { ok: false; message: string };

async function requireManager() {
  const user = await requireUser();
  if (!can(user.role, "members.manage")) {
    throw new Error("Only owners and administrators can change member privacy records.");
  }
  return user;
}

export async function setEmailConsent(memberId: string, granted: boolean, source: string): Promise<Result> {
  let user;
  try {
    user = await requireManager();
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  const cleanSource = source.trim();
  if (!cleanSource) return { ok: false, message: "Record how this consent change was received." };

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) return { ok: false, message: "Member not found." };
  if (member.email.endsWith("@erased.invalid")) return { ok: false, message: "This member's data has been erased." };

  const now = new Date();
  await prisma.$transaction([
    prisma.member.update({
      where: { id: memberId },
      data: granted
        ? { status: "SUBSCRIBED", consentAt: now, consentSource: cleanSource, unsubscribedAt: null }
        : { status: "UNSUBSCRIBED", unsubscribedAt: now },
    }),
    prisma.privacyEvent.create({
      data: {
        memberId,
        actorId: user.id,
        action: granted ? "consent.granted" : "consent.withdrawn",
        details: { channel: "email", source: cleanSource, previousStatus: member.status },
      },
    }),
  ]);

  revalidatePath("/privacy-gdpr");
  revalidatePath(`/privacy-gdpr/${memberId}`);
  return { ok: true };
}

export async function eraseMember(memberId: string, confirmEmail: string, reason: string): Promise<Result> {
  let user;
  try {
    user = await requireManager();
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) return { ok: false, message: "Member not found." };
  if (member.email.endsWith("@erased.invalid")) return { ok: false, message: "This member has already been erased." };
  if (confirmEmail.trim().toLowerCase() !== member.email.toLowerCase()) {
    return { ok: false, message: "The email you typed doesn't match this member." };
  }
  if (!reason.trim()) return { ok: false, message: "Record the reason for this erasure." };

  const placeholderEmail = `erased-${member.id}@erased.invalid`;

  await prisma.$transaction([
    prisma.memberGroup.deleteMany({ where: { memberId } }),
    prisma.delivery.updateMany({ where: { memberId }, data: { email: placeholderEmail } }),
    prisma.member.update({
      where: { id: memberId },
      data: {
        name: "Erased member",
        email: placeholderEmail,
        phone: null,
        gender: null,
        dateOfBirth: null,
        streetAddress: null,
        city: null,
        state: null,
        postalCode: null,
        country: null,
        notes: null,
        membershipType: null,
        source: null,
        consentSource: null,
        status: "UNSUBSCRIBED",
        unsubscribedAt: new Date(),
        membershipStatus: "erased",
      },
    }),
    prisma.privacyEvent.create({
      data: {
        memberId,
        actorId: user.id,
        action: "member.erased",
        details: { reason: reason.trim(), memberNumber: member.memberNumber },
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "privacy.member.erase",
        entityType: "Member",
        entityId: memberId,
        details: { memberNumber: member.memberNumber },
      },
    }),
  ]);

  revalidatePath("/privacy-gdpr");
  revalidatePath(`/privacy-gdpr/${memberId}`);
  return { ok: true };
}