import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma, type NewsletterStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { getActiveProvider, sendEmail, type SendResult } from "@/lib/email";

import {
  parseBlocks,
  renderNewsletter,
  type NewsletterBlock,
} from "@/lib/newsletter-blocks";

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

function getPublicAppOrigin(): string {
  const configuredUrl = process.env.APP_URL?.trim();

  if (!configuredUrl) {
    throw new ProcessorError(
      "APP_URL is not configured. Set the public application URL before sending newsletters.",
      500
    );
  }

  let url: URL;

  try {
    url = new URL(configuredUrl);
  } catch {
    throw new ProcessorError(
      "APP_URL must be a valid absolute application URL.",
      500
    );
  }

  const localDevelopment =
    process.env.NODE_ENV !== "production" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);

  if (
    url.username ||
    url.password ||
    (url.protocol !== "https:" &&
      !(localDevelopment && url.protocol === "http:"))
  ) {
    throw new ProcessorError(
      "APP_URL must use HTTPS in production. HTTP is allowed only for local development.",
      500
    );
  }

  return url.origin;
}

function createUnsubscribeUrl(
  origin: string,
  unsubscribeToken: string
): string {
  if (!unsubscribeToken.trim()) {
    throw new ProcessorError(
      "A recipient has no unsubscribe token. The delivery was not submitted.",
      500
    );
  }

  const url = new URL("/unsubscribe", origin);

  url.searchParams.set("token", unsubscribeToken);

  return url.toString();
}

// Fallback for legacy HTML or newsletters without a footer block.
function addUnsubscribeFooter(html: string, unsubscribeUrl: string): string {
  const footer = `
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      style="width:100%;font-family:Arial,sans-serif;"
    >
      <tr>
        <td align="center" style="padding:8px 16px 28px;">
          <table
            role="presentation"
            width="600"
            cellspacing="0"
            cellpadding="0"
            style="width:100%;max-width:600px;"
          >
            <tr>
              <td style="padding:12px 16px;text-align:center;">
                <p style="margin:0;font-size:11px;line-height:1.7;color:#64748B;">
                  Prefer not to receive these newsletter emails?
                  <a
                    href="${escapeHtml(unsubscribeUrl)}"
                    style="color:#002B3D;text-decoration:underline;"
                  >Unsubscribe</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  if (/<\/body\s*>/i.test(html)) {
    return html.replace(
      /<\/body\s*>/i,
      (closingTag) => `${footer}${closingTag}`
    );
  }

  return `${html}${footer}`;
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
      where: {
        id: campaignId,
      },
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

    // Validate saved blocks before claiming any deliveries.
    // Missing blocks indicate an older, HTML-only newsletter.
    let emailBlocks: NewsletterBlock[] | null = null;

    if (content.blocks !== undefined) {
      try {
        emailBlocks = parseBlocks(content.blocks).map((block) =>
          block.type === "footer"
            ? {
                ...block,
                fields: {
                  ...block.fields,
                  unsubscribeLabel:
                    block.fields.unsubscribeLabel?.trim() || "Unsubscribe",
                },
              }
            : block
        );
      } catch {
        throw new ProcessorError(
          "The campaign's saved newsletter blocks are invalid. Review the campaign before sending.",
          400
        );
      }
    }

    const hasFooterBlock =
      emailBlocks?.some((block) => block.type === "footer") ?? false;

    const headerImageUrl =
      typeof content.headerImageUrl === "string" ? content.headerImageUrl : "";

    const previewText =
      campaign.previewText ??
      (typeof content.previewText === "string" ? content.previewText : "");

    const isGroupAudience =
      audience !== "All Active Members" && audience !== "All Members";

    const audienceGroup = isGroupAudience
      ? await prisma.group.findUnique({
          where: {
            name: audience,
          },
          select: {
            id: true,
          },
        })
      : null;

    if (isGroupAudience && !audienceGroup) {
      throw new ProcessorError(
        "The campaign's audience group no longer exists.",
        400
      );
    }

    // A previously claimed QUEUED delivery may already have
    // reached SMTP. Never retry it blindly.
    const interruptedCount = await prisma.delivery.count({
      where: {
        newsletterId: campaign.id,
        status: "QUEUED",
        processingAt: {
          not: null,
        },
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
      // Validate configuration before claiming deliveries.
      const publicAppOrigin = getPublicAppOrigin();

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
        50,
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
        orderBy: [
          {
            createdAt: "asc",
          },
          {
            id: "asc",
          },
        ],
        take: batchSize,
        select: {
          id: true,
          memberId: true,
          email: true,
        },
      });

      if (batch.length > 0) {
        await prisma.emailProvider.update({
          where: {
            id: provider.id,
          },
          data: {
            lastCampaignBatchAt: now,
          },
        });
      }

      for (const delivery of batch) {
        // Recheck eligibility before claiming this delivery.
        const member = delivery.memberId
          ? await prisma.member.findUnique({
              where: {
                id: delivery.memberId,
              },
              select: {
                name: true,
                email: true,
                status: true,
                membershipStatus: true,
                unsubscribeToken: true,
                groups: {
                  select: {
                    groupId: true,
                  },
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

          // Preserve the existing suppression behavior.
          // The current schema has no SKIPPED status.
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

        const name = member.name.trim() || "Friend";

        const unsubscribeUrl = createUnsubscribeUrl(
          publicAppOrigin,
          member.unsubscribeToken
        );

        // Block-based newsletters receive the real URL in
        // their original footer, beside Manage Preferences.
        const renderedHtml =
          emailBlocks !== null
            ? renderNewsletter(emailBlocks, {
                subject: campaign.subject,
                headerImageUrl,
                previewText,
                unsubscribeUrl,
              })
            : campaignHtml;

        const personalizedHtml = personalize(renderedHtml, name, true);

        // Append a footer only if there is no rendered footer.
        const emailHtml = hasFooterBlock
          ? personalizedHtml
          : addUnsubscribeFooter(personalizedHtml, unsubscribeUrl);

        const emailText = [
          typeof content.bodyText === "string"
            ? personalize(content.bodyText, name)
            : "",

          `Unsubscribe from newsletter emails: ${unsubscribeUrl}`,
        ]
          .filter(Boolean)
          .join("\n\n");

        // Build the email before claiming the delivery, so a
        // rendering/configuration error does not create a claim.
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

        let outcome: SendResult;

        try {
          outcome = await sendEmail({
            to: delivery.email,
            subject: personalize(campaign.subject, name),
            html: emailHtml,
            text: emailText,
          });
        } catch (error) {
          // Preserve the claim when SMTP's outcome is uncertain.
          throw new ProcessorError(
            `Processing stopped for delivery ${delivery.id}. Inspect its result before retrying. ${
              error instanceof Error ? error.message : ""
            }`,
            500
          );
        }

        // If this write fails after SMTP submission, the claim
        // remains and the next run will require investigation.
        await prisma.delivery.update({
          where: {
            id: delivery.id,
          },
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
      where: {
        id: campaign.id,
      },
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
