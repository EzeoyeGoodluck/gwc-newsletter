// "use server";

// import { randomBytes } from "crypto";
// import { revalidatePath } from "next/cache";
// import { prisma } from "@/lib/prisma";
// import { requirePermission } from "@/lib/session";
// import { sendEmail } from "@/lib/email";
// import { ROLE_LABELS, assignableRoles, canManageRole } from "@/lib/permissions";

// const INVITE_DAYS = 7;

// export type ActionResult =
//   | { ok: true; message: string; inviteUrl?: string }
//   | { ok: false; message: string };

// function newToken() {
//   return randomBytes(32).toString("base64url");
// }

// function inviteExpiry() {
//   return new Date(Date.now() + INVITE_DAYS * 24 * 60 * 60 * 1000);
// }

// function buildInviteUrl(token: string) {
//   const base = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
//   return `${base}/accept-invite?token=${token}`;
// }

// async function sendInviteEmail(
//   email: string,
//   role: string,
//   inviterName: string,
//   url: string
// ) {
//   await sendEmail({
//     to: email,
//     subject: "You're invited to join Glory Worship Church on Sanctuary CMS",
//     text: `Hello,\n\n${inviterName} has invited you to join the Glory Worship Church workspace as ${ROLE_LABELS[role] ?? role}.\n\nCreate your account using this link (it expires in ${INVITE_DAYS} days):\n\n${url}\n\nIf you weren't expecting this, you can ignore this email.`,
//   });
// }

// export async function inviteMember(formData: FormData): Promise<ActionResult> {
//   const actor = await requirePermission("team.manage");
//   const email = String(formData.get("email") ?? "")
//     .trim()
//     .toLowerCase();
//   const role = String(formData.get("role") ?? "");

//   if (!email || !email.includes("@")) {
//     return { ok: false, message: "Please enter a valid email address." };
//   }

//   if (!assignableRoles(actor.role).includes(role as never)) {
//     return {
//       ok: false,
//       message: "You don't have permission to invite someone with that role.",
//     };
//   }

//   const existingUser = await prisma.user.findUnique({ where: { email } });
//   if (existingUser) {
//     return {
//       ok: false,
//       message: "Someone with that email already has an account.",
//     };
//   }

//   await prisma.invitation.updateMany({
//     where: { email, status: "PENDING" },
//     data: { status: "REVOKED" },
//   });

//   const token = newToken();
//   await prisma.invitation.create({
//     data: {
//       email,
//       role,
//       token,
//       invitedById: actor.id,
//       expiresAt: inviteExpiry(),
//     },
//   });

//   const inviteUrl = buildInviteUrl(token);
//   revalidatePath("/team");

//   try {
//     await sendInviteEmail(email, role, actor.name, inviteUrl);
//   } catch {
//     return {
//       ok: true,
//       message:
//         "Invitation created, but the email could not be sent. Copy the link below and share it directly.",
//       inviteUrl,
//     };
//   }

//   return { ok: true, message: `Invitation sent to ${email}.`, inviteUrl };
// }

// export async function resendInvitation(
//   invitationId: string
// ): Promise<ActionResult> {
//   const actor = await requirePermission("team.manage");
//   const invitation = await prisma.invitation.findUnique({
//     where: { id: invitationId },
//   });

//   if (!invitation || invitation.status !== "PENDING") {
//     return { ok: false, message: "This invitation is no longer active." };
//   }
//   if (!canManageRole(actor.role, invitation.role)) {
//     return {
//       ok: false,
//       message: "You don't have permission to manage this invitation.",
//     };
//   }

//   const token = newToken();
//   await prisma.invitation.update({
//     where: { id: invitation.id },
//     data: { token, expiresAt: inviteExpiry(), claimedAt: null },
//   });

//   const inviteUrl = buildInviteUrl(token);
//   revalidatePath("/team");

//   try {
//     await sendInviteEmail(
//       invitation.email,
//       invitation.role,
//       actor.name,
//       inviteUrl
//     );
//   } catch {
//     return {
//       ok: true,
//       message:
//         "New link created, but the email could not be sent. Copy it below.",
//       inviteUrl,
//     };
//   }

//   return {
//     ok: true,
//     message: `A fresh invitation was sent to ${invitation.email}.`,
//     inviteUrl,
//   };
// }

// export async function revokeInvitation(
//   invitationId: string
// ): Promise<ActionResult> {
//   const actor = await requirePermission("team.manage");
//   const invitation = await prisma.invitation.findUnique({
//     where: { id: invitationId },
//   });

//   if (!invitation || invitation.status !== "PENDING") {
//     return { ok: false, message: "This invitation is no longer active." };
//   }
//   if (!canManageRole(actor.role, invitation.role)) {
//     return {
//       ok: false,
//       message: "You don't have permission to manage this invitation.",
//     };
//   }

//   await prisma.invitation.update({
//     where: { id: invitation.id },
//     data: { status: "REVOKED" },
//   });
//   revalidatePath("/team");
//   return { ok: true, message: "Invitation cancelled." };
// }

// export async function changeMemberRole(
//   userId: string,
//   newRole: string
// ): Promise<ActionResult> {
//   const actor = await requirePermission("team.manage");
//   const target = await prisma.user.findUnique({ where: { id: userId } });

//   if (!target) return { ok: false, message: "That person no longer exists." };
//   if (target.id === actor.id)
//     return { ok: false, message: "You can't change your own role." };
//   if (
//     !canManageRole(actor.role, target.role) ||
//     !canManageRole(actor.role, newRole)
//   ) {
//     return {
//       ok: false,
//       message: "You don't have permission to make that change.",
//     };
//   }

//   await prisma.user.update({
//     where: { id: target.id },
//     data: { role: newRole },
//   });
//   revalidatePath("/team");
//   return {
//     ok: true,
//     message: `${target.name} is now ${ROLE_LABELS[newRole] ?? newRole}.`,
//   };
// }

// export async function removeMember(userId: string): Promise<ActionResult> {
//   const actor = await requirePermission("team.manage");
//   const target = await prisma.user.findUnique({ where: { id: userId } });

//   if (!target) return { ok: false, message: "That person no longer exists." };
//   if (target.id === actor.id)
//     return { ok: false, message: "You can't remove yourself." };
//   if (!canManageRole(actor.role, target.role)) {
//     return {
//       ok: false,
//       message: "You don't have permission to remove this person.",
//     };
//   }

//   await prisma.user.delete({ where: { id: target.id } });
//   revalidatePath("/team");
//   return {
//     ok: true,
//     message: `${target.name} has been removed and signed out.`,
//   };
// }
