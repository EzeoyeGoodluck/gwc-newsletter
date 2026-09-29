import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "mysql" }),

  emailAndPassword: { enabled: true },

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
              claimedAt: { gt: new Date(Date.now() - 60_000) },
            },
          });

          if (!invitation) {
            throw new APIError("FORBIDDEN", {
              message:
                "This workspace is invite-only. Ask your church administrator for an invitation.",
            });
          }

          return { data: { ...user, role: invitation.role } };
        },
      },
    },
  },

  plugins: [nextCookies()],
});
