import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

const CLAIM_WINDOW_MS = 60_000;

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "mysql" }),

  emailAndPassword: {
    enabled: true,
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Reset your Sanctuary CMS password",
        text: `Hi ${user.name},\n\nWe received a request to reset your password. Use the link below to choose a new one. This link expires in 1 hour.\n\n${url}\n\nIf you didn't ask for this, you can ignore this email and your password will stay the same.`,
      });
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "VIEWER",
        input: false,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const userCount = await prisma.user.count();

          if (userCount === 0) {
            return { data: { ...user, role: "OWNER" } };
          }

          const invitation = await prisma.invitation.findFirst({
            where: {
              email: user.email.toLowerCase(),
              status: "PENDING",
              expiresAt: { gt: new Date() },
              claimedAt: { gt: new Date(Date.now() - CLAIM_WINDOW_MS) },
            },
            orderBy: { claimedAt: "desc" },
          });

          if (!invitation) {
            throw new APIError("FORBIDDEN", {
              message:
                "This workspace is invite-only. Ask your church administrator for an invitation.",
            });
          }

          return { data: { ...user, role: invitation.role } };
        },

        after: async (user) => {
          const email = user.email.toLowerCase();

          const invitation = await prisma.invitation.findFirst({
            where: {
              email,
              status: "PENDING",
              claimedAt: { gt: new Date(Date.now() - CLAIM_WINDOW_MS) },
            },
            orderBy: { claimedAt: "desc" },
          });

          if (!invitation) return;

          await prisma.invitation.update({
            where: { id: invitation.id },
            data: { status: "ACCEPTED", acceptedAt: new Date() },
          });

          await prisma.invitation.updateMany({
            where: { email, status: "PENDING", id: { not: invitation.id } },
            data: { status: "CANCELLED" },
          });

          await prisma.auditLog.create({
            data: {
              actorId: user.id,
              action: "team.invite.accept",
              entityType: "Invitation",
              entityId: invitation.id,
              details: { email, role: invitation.role },
            },
          });
        },
      },
    },
  },

  plugins: [nextCookies()],
});
