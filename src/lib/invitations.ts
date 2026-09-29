import "server-only";
import { prisma } from "@/lib/prisma";

export const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Administrator",
  EDITOR: "Editor",
  VIEWER: "Viewer",
};

export async function getValidInvitation(token: string | undefined) {
  if (!token) return null;

  const invitation = await prisma.invitation.findUnique({ where: { token } });

  if (!invitation) return null;
  if (invitation.status !== "PENDING") return null;
  if (invitation.expiresAt < new Date()) return null;

  return invitation;
}
