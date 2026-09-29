import "server-only";
import { prisma } from "@/lib/prisma";
export { ROLE_LABELS } from "@/lib/permissions";

export async function getValidInvitation(token: string | undefined) {
  if (!token) return null;

  const invitation = await prisma.invitation.findUnique({ where: { token } });

  if (!invitation) return null;
  if (invitation.status !== "PENDING") return null;
  if (invitation.expiresAt < new Date()) return null;

  return invitation;
}
