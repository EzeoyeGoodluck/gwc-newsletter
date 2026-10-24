"use server";

import { prisma } from "@/lib/prisma";

export type UnsubscribeResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
    };

export async function unsubscribeMember(
  token: string
): Promise<UnsubscribeResult> {
  if (
    typeof token !== "string" ||
    token.length < 16 ||
    token.length > 200 ||
    !/^[a-zA-Z0-9_-]+$/.test(token)
  ) {
    return {
      ok: false,
      message:
        "This unsubscribe link is invalid. Please use the link in your newsletter.",
    };
  }

  try {
    return await prisma.$transaction(async (tx): Promise<UnsubscribeResult> => {
      const member = await tx.member.findUnique({
        where: {
          unsubscribeToken: token,
        },
        select: {
          id: true,
        },
      });

      if (!member) {
        return {
          ok: false,
          message: "This unsubscribe link is invalid or no longer available.",
        };
      }

      // Repeated requests do not create repeated privacy events.
      const updated = await tx.member.updateMany({
        where: {
          id: member.id,
          unsubscribeToken: token,
          status: {
            not: "UNSUBSCRIBED",
          },
        },
        data: {
          status: "UNSUBSCRIBED",
          unsubscribedAt: new Date(),
        },
      });

      if (updated.count === 1) {
        await tx.privacyEvent.create({
          data: {
            memberId: member.id,
            action: "UNSUBSCRIBE",
            details: {
              source: "newsletter_footer",
            },
          },
        });
      }

      return {
        ok: true,
      };
    });
  } catch {
    // Do not log the private unsubscribe token.
    console.error("Newsletter unsubscribe request failed.");

    return {
      ok: false,
      message: "We could not update your subscription. Please try again.",
    };
  }
}
