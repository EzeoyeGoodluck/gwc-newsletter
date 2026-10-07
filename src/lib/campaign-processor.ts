import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma, type NewsletterStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getActiveProvider, sendEmail, type SendResult } from "@/lib/email";

type ProcessInput = {
  campaignId: string;
};

type DeliveryResult = {
  deliveryId: string;
  status: "sent" | "failed";
  error?: string;
};

export class ProcessorError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ProcessorError";
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function personalize(value: string, name: string, html = false): string {
  const replacement = html ? escapeHtml(name) : name;

  return value.replaceAll("{{memberName}}", replacement);
}

function remainingAllowance(limit: number | null, used: number): number {
  return limit === null ? Infinity : Math.max(0, limit - used);
}

export async function processCampaignBatch(input: ProcessInput) {
  const campaignId = input.campaignId.trim();

  if (!campaignId) {
    throw new ProcessorError("A campaign ID is required.", 400);
  }

  const lockId = "campaign-smtp-queue";
  const token = randomUUID();

  // Persistent lock: an interrupted run requires investigation.
  try {
    await prisma.campaignQueueLock.create({
      data: {
        id: lockId,
        token,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ProcessorError(
        "Another campaign processor is running, or an interrupted run left a lock. Inspect the previous run before clearing it.",
        409
      );
    }

    throw error;
  }

  try {
    const campaign = await prisma.newsletter.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new ProcessorError("Campaign not found.", 404);
    }

    if (campaign.status !== "SENDING") {
      throw new ProcessorError(
        "Only campaigns marked SENDING can be processed here.",
        409
      );
    }

    const campaignHtml = campaign.html;

    if (!campaignHtml?.trim()) {
      throw new ProcessorError("The campaign has no saved email HTML.", 400);
    }

    const content: Record<string, unknown> =
      campaign.content &&
      typeof campaign.content === "object" &&
      !Array.isArray(campaign.content)
        ? (campaign.content as Record<string, unknown>)
        : {};

    const audience =
      typeof content.audience === "string" ? content.audience : "";

    if (!audience.trim()) {
      throw new ProcessorError("The campaign has no saved audience.", 400);
    }

    const isGroupAudience =
      audience !== "All Active Members" && audience !== "All Members";

    const audienceGroup = isGroupAudience
      ? await prisma.group.findUnique({
          where: { name: audience },
          select: { id: true },
        })
      : null;

    if (isGroupAudience && !audienceGroup) {
      throw new ProcessorError(
        "The campaign's audience group no longer exists.",
        400
      );
    }

    // A previously claimed QUEUED record may have been submitted
    // to SMTP without its result being saved. Never retry blindly.
    const interruptedCount = await prisma.delivery.count({
      where: {
        newsletterId: campaign.id,
        status: "QUEUED",
        processingAt: { not: null },
      },
    });

    if (interruptedCount > 0) {
      throw new ProcessorError(
        `${interruptedCount} queued delivery record(s) were previously claimed. Check SMTP logs and delivery results before retrying.`,
        409
      );
    }

    const queuedCount = await prisma.delivery.count({
      where: {
        newsletterId: campaign.id,
        status: "QUEUED",
        processingAt: null,
      },
    });

    const results: DeliveryResult[] = [];

    if (queuedCount > 0) {
      const provider = await getActiveProvider();

      if (!provider) {
        throw new ProcessorError("No active SMTP provider is configured.", 400);
      }

      const now = new Date();

      const delayMs = Math.max(0, provider.batchDelaySec) * 1000;

      if (
        provider.lastCampaignBatchAt &&
        now.getTime() - provider.lastCampaignBatchAt.getTime() < delayMs
      ) {
        const availableAt = new Date(
          provider.lastCampaignBatchAt.getTime() + delayMs
        );

        throw new ProcessorError(
          `The configured batch delay is active. The next campaign batch is available after ${availableAt.toISOString()}.`,
          429
        );
      }

      // Counts cover recorded campaign deliveries only.
      const [sentLastHour, sentLastDay] = await Promise.all([
        prisma.delivery.count({
          where: {
            status: "SENT",
            sentAt: {
              gte: new Date(now.getTime() - 60 * 60 * 1000),
            },
          },
        }),

        prisma.delivery.count({
          where: {
            status: "SENT",
            sentAt: {
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      const hourlyRemaining = remainingAllowance(
        provider.maxPerHour,
        sentLastHour
      );

      const dailyRemaining = remainingAllowance(
        provider.maxPerDay,
        sentLastDay
      );

      const batchSize = Math.min(
        Math.max(1, provider.batchSize),
        10,
        hourlyRemaining,
        dailyRemaining
      );

      if (batchSize <= 0) {
        throw new ProcessorError(
          "The campaign sending limit has been reached.",
          429
        );
      }

      const batch = await prisma.delivery.findMany({
        where: {
          newsletterId: campaign.id,
          status: "QUEUED",
          processingAt: null,
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: batchSize,
        select: {
          id: true,
          memberId: true,
          email: true,
        },
      });

      if (batch.length > 0) {
        await prisma.emailProvider.update({
          where: { id: provider.id },
          data: {
            lastCampaignBatchAt: now,
          },
        });
      }

      for (const delivery of batch) {
        // Check eligibility before claiming the delivery.
        const member = delivery.memberId
          ? await prisma.member.findUnique({
              where: { id: delivery.memberId },
              select: {
                name: true,
                email: true,
                status: true,
                membershipStatus: true,
                groups: {
                  select: { groupId: true },
                },
              },
            })
          : null;

        const eligible =
          member !== null &&
          member.status === "SUBSCRIBED" &&
          member.email.toLowerCase() === delivery.email.toLowerCase() &&
          (audience === "All Members" ||
            (audience === "All Active Members" &&
              member.membershipStatus === "active") ||
            (isGroupAudience &&
              audienceGroup !== null &&
              member.groups.some(
                (membership) => membership.groupId === audienceGroup.id
              )));

        if (!eligible || !member) {
          const reason =
            "Not sent: the recipient is no longer eligible for this audience, or the queued email no longer matches the member.";

          // No SKIPPED enum exists in the current schema.
          const excluded = await prisma.delivery.updateMany({
            where: {
              id: delivery.id,
              status: "QUEUED",
              processingAt: null,
            },
            data: {
              status: "FAILED",
              error: reason,
            },
          });

          if (excluded.count === 1) {
            results.push({
              deliveryId: delivery.id,
              status: "failed",
              error: reason,
            });
          }

          continue;
        }

        const claimed = await prisma.delivery.updateMany({
          where: {
            id: delivery.id,
            status: "QUEUED",
            processingAt: null,
          },
          data: {
            processingAt: new Date(),
          },
        });

        if (claimed.count !== 1) {
          continue;
        }

        const name = member.name.trim() || "Friend";

        let outcome: SendResult;

        try {
          outcome = await sendEmail({
            to: delivery.email,
            subject: personalize(campaign.subject, name),
            html: personalize(campaignHtml, name, true),
            text:
              typeof content.bodyText === "string"
                ? personalize(content.bodyText, name)
                : undefined,
          });
        } catch (error) {
          // Leave the delivery claimed after an unexpected error.
          throw new ProcessorError(
            `Processing stopped for delivery ${delivery.id}. Inspect its result before retrying. ${
              error instanceof Error ? error.message : ""
            }`,
            500
          );
        }

        // If this write fails after SMTP submission, processingAt
        // remains set and a later run will require investigation.
        await prisma.delivery.update({
          where: { id: delivery.id },
          data: outcome.ok
            ? {
                status: "SENT",
                sentAt: new Date(),
                error: null,
              }
            : {
                status: "FAILED",
                error: outcome.error.slice(0, 10_000),
              },
        });

        results.push(
          outcome.ok
            ? {
                deliveryId: delivery.id,
                status: "sent",
              }
            : {
                deliveryId: delivery.id,
                status: "failed",
                error: outcome.error,
              }
        );
      }
    }

    const [remaining, sent, failed, bounced] = await Promise.all([
      prisma.delivery.count({
        where: {
          newsletterId: campaign.id,
          status: "QUEUED",
        },
      }),

      prisma.delivery.count({
        where: {
          newsletterId: campaign.id,
          status: "SENT",
        },
      }),

      prisma.delivery.count({
        where: {
          newsletterId: campaign.id,
          status: "FAILED",
        },
      }),

      prisma.delivery.count({
        where: {
          newsletterId: campaign.id,
          status: "BOUNCED",
        },
      }),
    ]);

    const total = remaining + sent + failed + bounced;

    const finalStatus: NewsletterStatus =
      remaining > 0
        ? "SENDING"
        : failed + bounced > 0 || total === 0
          ? "FAILED"
          : "SENT";

    await prisma.newsletter.update({
      where: { id: campaign.id },
      data: {
        status: finalStatus,
        sentCount: sent,
        failedCount: failed + bounced,
        sentAt: finalStatus === "SENT" ? new Date() : null,
      },
    });

    return {
      campaignId: campaign.id,
      status: finalStatus,
      processedThisRun: results.length,
      sent,
      failed: failed + bounced,
      remaining,
      results,
    };
  } finally {
    await prisma.campaignQueueLock.deleteMany({
      where: {
        id: lockId,
        token,
      },
    });
  }
}
