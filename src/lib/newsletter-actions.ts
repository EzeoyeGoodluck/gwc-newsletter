"use server";

import { Prisma, NewsletterStatus } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { sendEmail } from "@/lib/email";
import {
  blocksToText,
  parseBlocks,
  renderNewsletter,
  type NewsletterBlock,
} from "@/lib/newsletter-blocks";
type Result<T> = { ok: true; data: T } | { ok: false; message: string };

const ALL_ACTIVE = "All Active Members";
const ALL_MEMBERS = "All Members";

function recipientWhere(audience: string): Prisma.MemberWhereInput {
  const base: Prisma.MemberWhereInput = { status: "SUBSCRIBED" };
  if (audience === ALL_ACTIVE) return { ...base, membershipStatus: "active" };
  if (audience === ALL_MEMBERS) return base;
  return { ...base, groups: { some: { group: { name: audience } } } };
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(subject: string, headerImageUrl: string, bodyText: string) {
  const paragraphs = bodyText
    .split(/\n{2,}/)
    .map(
      (p) =>
        `<p style="margin:0 0 16px;line-height:1.6">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`
    )
    .join("");
  const img = headerImageUrl
    ? `<img src="${escapeHtml(headerImageUrl)}" alt="" style="width:100%;display:block;border-radius:8px;margin-bottom:24px"/>`
    : "";
  return `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1B2A4A">${img}<h1 style="font-size:24px;margin:0 0 16px">${escapeHtml(subject)}</h1>${paragraphs}</div>`;
}

export async function countRecipients(
  audience: string
): Promise<Result<number>> {
  await requireUser();
  const count = await prisma.member.count({ where: recipientWhere(audience) });
  return { ok: true, data: count };
}

export type SaveNewsletterInput = {
  id?: string;
  intent: "draft" | "scheduled" | "send";
  campaignName: string;
  subjectLine: string;
  audience: string;
  category: string;
  scheduledDate?: string;
  templateId?: string | null;
  headerImageUrl: string;
  bodyText: string;

  // New block-editor fields
  previewText?: string;
  blocks?: NewsletterBlock[];
};
export async function saveNewsletter(
  input: SaveNewsletterInput
): Promise<Result<{ id: string }>> {
  const user = await requireUser();
  const permission =
    input.intent === "draft" ? "newsletters.edit" : "newsletters.publish";

  if (!can(user.role, permission)) {
    return {
      ok: false,
      message: "You do not have permission to perform this action.",
    };
  }
  let blocks: NewsletterBlock[] | undefined;

  try {
    blocks = input.blocks === undefined ? undefined : parseBlocks(input.blocks);
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Invalid newsletter blocks.",
    };
  }

  const previewText = (input.previewText ?? "").trim();

  if (previewText.length > 500) {
    return {
      ok: false,
      message: "Preview text must be 500 characters or fewer.",
    };
  }

  const bodyText = blocks === undefined ? input.bodyText : blocksToText(blocks);

  const contentJson: Prisma.InputJsonObject = {
    version: 1,
    audience: input.audience,
    headerImageUrl: input.headerImageUrl,
    bodyText,
    previewText,

    ...(blocks !== undefined
      ? {
          blocks: blocks.map((block) => ({
            id: block.id,
            type: block.type,
            fields: { ...block.fields },
          })),
        }
      : {}),
  };

  const title = input.campaignName.trim() || "Untitled Campaign";
  const subject = input.subjectLine.trim();
  if (input.intent !== "draft" && !subject) {
    return { ok: false, message: "A subject line is required before sending." };
  }

  let scheduledAt: Date | null = null;
  if (input.intent === "scheduled") {
    scheduledAt = input.scheduledDate ? new Date(input.scheduledDate) : null;
    if (
      !scheduledAt ||
      isNaN(scheduledAt.getTime()) ||
      scheduledAt <= new Date()
    ) {
      return {
        ok: false,
        message: "Please choose a future date and time to schedule.",
      };
    }
  }

  const isGroup =
    input.audience !== ALL_ACTIVE && input.audience !== ALL_MEMBERS;
  const group = isGroup
    ? await prisma.group.findUnique({
        where: { name: input.audience },
        select: { id: true },
      })
    : null;
  if (isGroup && !group) {
    return {
      ok: false,
      message: `The audience "${input.audience}" no longer exists.`,
    };
  }

  const recipients = await prisma.member.findMany({
    where: recipientWhere(input.audience),
    select: { id: true, email: true },
  });

  if (input.intent === "send" && recipients.length === 0) {
    return {
      ok: false,
      message: "This audience has no subscribed members to send to.",
    };
  }

  const status: NewsletterStatus =
    input.intent === "draft"
      ? "DRAFT"
      : input.intent === "scheduled"
        ? "SCHEDULED"
        : "SENDING";

  try {
    const newsletter = await prisma.$transaction(async (tx) => {
      const newsletterData = {
        title,
        subject: subject || title,
        category: input.category,
        status,
        sendToAll: !isGroup,
        scheduledAt: input.intent === "send" ? new Date() : scheduledAt,
        recipientCount: recipients.length,
        templateId: input.templateId || null,
        previewText: previewText || null,
        content: contentJson,
        html:
          blocks === undefined
            ? buildHtml(subject || title, input.headerImageUrl, input.bodyText)
            : renderNewsletter(blocks, {
                subject: subject || title,
                headerImageUrl: input.headerImageUrl,
                previewText,
              }),
      };

      let saved: { id: string };

      if (input.id) {
        // Check the current status within the update itself.
        const updated = await tx.newsletter.updateMany({
          where: {
            id: input.id,
            status: "DRAFT",
          },
          data: newsletterData,
        });

        if (updated.count !== 1) {
          throw new Error(
            "The campaign no longer exists or is no longer a draft. Refresh the dashboard."
          );
        }

        // An editable draft must not have an existing delivery queue.
        const deliveryCount = await tx.delivery.count({
          where: { newsletterId: input.id },
        });

        if (deliveryCount !== 0) {
          throw new Error(
            "This draft already has delivery records. Inspect its queue before editing or sending."
          );
        }

        await tx.newsletterGroup.deleteMany({
          where: { newsletterId: input.id },
        });

        if (group) {
          await tx.newsletterGroup.create({
            data: {
              newsletterId: input.id,
              groupId: group.id,
            },
          });
        }

        saved = { id: input.id };
      } else {
        saved = await tx.newsletter.create({
          data: {
            ...newsletterData,
            authorId: user.id,
            groups: group ? { create: [{ groupId: group.id }] } : undefined,
          },
          select: { id: true },
        });
      }

      if (input.intent === "send") {
        await tx.delivery.createMany({
          data: recipients.map((recipient) => ({
            newsletterId: saved.id,
            memberId: recipient.id,
            email: recipient.email,
          })),
          skipDuplicates: true,
        });
      }

      return saved;
    });

    return { ok: true, data: newsletter };
  } catch (error) {
    console.error("Failed to save newsletter:", error);

    return {
      ok: false,
      message:
        error instanceof Error &&
        (error.message.startsWith("The campaign no longer") ||
          error.message.startsWith("This draft already"))
          ? error.message
          : "Unable to save the campaign. Please try again.",
    };
  }
}

export type CampaignRow = {
  id: string;
  campaignId: string;
  title: string;
  status: "draft" | "scheduled" | "sending" | "sent" | "failed";
  category: string;
  audience: string;
  lastEdited: string;
};

function relative(date: Date) {
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export async function listNewsletters(): Promise<Result<CampaignRow[]>> {
  await requireUser();
  const rows = await prisma.newsletter.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return {
    ok: true,
    data: rows.map((n) => {
      const c = (n.content ?? {}) as { audience?: string };
      const statusMap: Record<NewsletterStatus, CampaignRow["status"]> = {
        DRAFT: "draft",
        SCHEDULED: "scheduled",
        SENDING: "sending",
        SENT: "sent",
        FAILED: "failed",
      };

      const status = statusMap[n.status];
      return {
        id: n.id,
        campaignId: `CMP-${n.createdAt.getFullYear()}-${String(n.createdAt.getMonth() + 1).padStart(2, "0")}-${n.id.slice(-4).toUpperCase()}`,
        title: n.title,
        status,
        category: n.category ?? "General",
        audience: c.audience ?? (n.sendToAll ? ALL_MEMBERS : "Group"),
        lastEdited: relative(n.updatedAt),
      };
    }),
  };
}

export async function deleteNewsletter(id: string): Promise<Result<null>> {
  const user = await requireUser();

  if (!can(user.role, "newsletters.edit")) {
    return {
      ok: false,
      message: "You do not have permission to delete campaigns.",
    };
  }

  const campaignId = id.trim();

  if (!campaignId) {
    return {
      ok: false,
      message: "A campaign ID is required.",
    };
  }

  // Use the SAME lock as processCampaignBatch().
  // This prevents deletion during an active processing batch.
  const lockId = "campaign-smtp-queue";
  const token = randomUUID();

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
      return {
        ok: false,
        message:
          "Deletion is blocked because an email processor is running, or an interrupted run left a queue lock. Wait for the active batch to finish. If the lock persists, inspect the interrupted run before clearing it.",
      };
    }

    console.error("Failed to acquire campaign deletion lock:", error);

    return {
      ok: false,
      message:
        "Unable to check whether campaign processing is active. The campaign was not deleted.",
    };
  }

  try {
    return await prisma.$transaction(async (tx): Promise<Result<null>> => {
      const campaign = await tx.newsletter.findUnique({
        where: { id: campaignId },
        select: {
          id: true,
          status: true,
        },
      });

      if (!campaign) {
        return {
          ok: false,
          message: "The campaign no longer exists.",
        };
      }

      // Scheduling is a separate workflow.
      if (campaign.status === "SCHEDULED") {
        return {
          ok: false,
          message:
            "Scheduled campaigns must be cancelled before deletion. Cancellation is not connected yet.",
        };
      }

      // A claimed QUEUED delivery may already have reached SMTP
      // without its result being recorded. Preserve that evidence.
      const unresolvedDeliveries = await tx.delivery.count({
        where: {
          newsletterId: campaignId,
          status: "QUEUED",
          processingAt: {
            not: null,
          },
        },
      });

      if (unresolvedDeliveries > 0) {
        return {
          ok: false,
          message:
            `This campaign has ${unresolvedDeliveries} delivery record(s) with an uncertain sending result. ` +
            "Check SMTP logs and reconcile those records before deleting. The campaign was not deleted.",
        };
      }

      const deleted = await tx.newsletter.deleteMany({
        where: {
          id: campaignId,
          status: {
            in: ["DRAFT", "SENDING", "SENT", "FAILED"],
          },
        },
      });

      if (deleted.count !== 1) {
        return {
          ok: false,
          message:
            "The campaign changed or no longer exists. Refresh the dashboard and try again.",
        };
      }

      return {
        ok: true,
        data: null,
      };
    });
  } catch (error) {
    console.error("Failed to delete campaign:", error);

    return {
      ok: false,
      message:
        "Unable to delete the campaign. Refresh the dashboard to confirm its current state before trying again.",
    };
  } finally {
    // Release only the lock acquired by this delete operation.
    await prisma.campaignQueueLock.deleteMany({
      where: {
        id: lockId,
        token,
      },
    });
  }
}
export async function duplicateNewsletter(
  id: string
): Promise<Result<{ id: string }>> {
  const user = await requireUser();

  if (!can(user.role, "newsletters.edit")) {
    return {
      ok: false,
      message: "You do not have permission to duplicate campaigns.",
    };
  }

  if (!id.trim()) {
    return {
      ok: false,
      message: "A campaign ID is required.",
    };
  }

  const duplicate = await prisma.$transaction(async (tx) => {
    const source = await tx.newsletter.findUnique({
      where: { id },
      include: {
        groups: {
          select: { groupId: true },
        },
      },
    });

    if (!source) {
      return null;
    }

    return tx.newsletter.create({
      data: {
        title: `${source.title} (Copy)`,
        subject: source.subject,
        previewText: source.previewText,

        // Preserve saved editor content and rendered HTML.
        content:
          source.content === null
            ? Prisma.DbNull
            : (source.content as Prisma.InputJsonValue),
        html: source.html,

        category: source.category,
        sendToAll: source.sendToAll,
        templateId: source.templateId,
        authorId: user.id,

        // A duplicate starts as an unsent draft.
        status: "DRAFT",
        scheduledAt: null,
        sentAt: null,
        recipientCount: 0,
        sentCount: 0,
        failedCount: 0,
        openCount: 0,
        clickCount: 0,

        groups:
          source.groups.length > 0
            ? {
                create: source.groups.map(({ groupId }) => ({
                  groupId,
                })),
              }
            : undefined,

        // Do not copy deliveries or their tracking identifiers.
      },
      select: { id: true },
    });
  });

  if (!duplicate) {
    return {
      ok: false,
      message: "The campaign no longer exists. Refresh the dashboard.",
    };
  }

  return {
    ok: true,
    data: duplicate,
  };
}

export type EditableNewsletter = {
  id: string;
  campaignName: string;
  subjectLine: string;
  audience: string;
  category: string;
  templateId: string | null;
  headerImageUrl: string;
  bodyText: string;
  previewText: string;
  blocks?: NewsletterBlock[];
};

export async function getNewsletterForEditing(
  id: string
): Promise<Result<EditableNewsletter>> {
  const user = await requireUser();

  if (!can(user.role, "newsletters.edit")) {
    return {
      ok: false,
      message: "You do not have permission to edit campaigns.",
    };
  }

  const newsletter = await prisma.newsletter.findUnique({
    where: { id },
  });

  if (!newsletter) {
    return { ok: false, message: "Campaign not found." };
  }

  // Keep this first implementation limited to unsent drafts.
  if (newsletter.status !== "DRAFT") {
    return {
      ok: false,
      message: "Only draft campaigns can be edited here.",
    };
  }

  const content =
    newsletter.content &&
    typeof newsletter.content === "object" &&
    !Array.isArray(newsletter.content)
      ? (newsletter.content as Record<string, unknown>)
      : {};

  // Do not silently replace content whose audience cannot be recovered.
  if (typeof content.audience !== "string" || !content.audience.trim()) {
    return {
      ok: false,
      message: "This campaign has no saved audience and cannot be loaded.",
    };
  }

  let blocks: NewsletterBlock[] | undefined;

  try {
    blocks =
      content.blocks === undefined ? undefined : parseBlocks(content.blocks);
  } catch {
    return {
      ok: false,
      message: "This campaign's saved blocks could not be loaded.",
    };
  }

  return {
    ok: true,
    data: {
      id: newsletter.id,
      campaignName: newsletter.title,
      subjectLine: newsletter.subject,
      audience: content.audience,
      category: newsletter.category ?? "General",
      templateId: newsletter.templateId,
      headerImageUrl:
        typeof content.headerImageUrl === "string"
          ? content.headerImageUrl
          : "",
      bodyText: typeof content.bodyText === "string" ? content.bodyText : "",
      previewText:
        newsletter.previewText ??
        (typeof content.previewText === "string" ? content.previewText : ""),
      blocks,
    },
  };
}
export type SendNewsletterTestInput = {
  email: string;
  subjectLine: string;
  headerImageUrl: string;
  previewText?: string;
  blocks: NewsletterBlock[];
};

export async function sendNewsletterTest(
  input: SendNewsletterTestInput
): Promise<Result<{ email: string }>> {
  const user = await requireUser();

  if (!can(user.role, "newsletters.publish")) {
    return {
      ok: false,
      message: "You do not have permission to send test newsletters.",
    };
  }

  if (!input || typeof input !== "object") {
    return { ok: false, message: "Invalid test request." };
  }

  const email = typeof input.email === "string" ? input.email.trim() : "";
  const subject =
    typeof input.subjectLine === "string" ? input.subjectLine.trim() : "";
  const previewText =
    typeof input.previewText === "string" ? input.previewText.trim() : "";

  // Accept one plain address, not a recipient list or display-name syntax.
  if (
    email.length > 254 ||
    !/^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(email)
  ) {
    return {
      ok: false,
      message: "Enter one valid email address.",
    };
  }

  if (!subject || subject.length > 200 || /[\r\n]/.test(subject)) {
    return {
      ok: false,
      message: "Enter a subject line of 200 characters or fewer.",
    };
  }

  if (previewText.length > 500) {
    return {
      ok: false,
      message: "Preview text must be 500 characters or fewer.",
    };
  }

  if (
    typeof input.headerImageUrl !== "string" ||
    input.headerImageUrl.length > 20_000
  ) {
    return {
      ok: false,
      message: "Invalid header image URL.",
    };
  }

  try {
    const blocks = parseBlocks(input.blocks);

    if (blocks.length === 0) {
      return {
        ok: false,
        message: "Add some newsletter content before sending a test.",
      };
    }

    // Personalise the test without looking up or modifying a member.
    const testBlocks = blocks.map((block) => ({
      ...block,
      fields: Object.fromEntries(
        Object.entries(block.fields).map(([key, value]) => [
          key,
          value.replace(/\{\{memberName\}\}/g, "Testing member"),
        ])
      ),
    }));

    const testSubject = subject.replace(
      /\{\{memberName\}\}/g,
      "Testing member"
    );

    const testPreviewText = previewText.replace(
      /\{\{memberName\}\}/g,
      "Testing member"
    );

    const html = renderNewsletter(testBlocks, {
      subject: testSubject,
      headerImageUrl: input.headerImageUrl,
      previewText: testPreviewText,
      // Do not create real recipient-specific preference/unsubscribe links.
    });

    const result = await sendEmail({
      to: email,
      subject: `[TEST] ${testSubject}`,
      text: blocksToText(testBlocks),
      html,
    });

    if (!result.ok) {
      console.error("[newsletter-test] Failed:", result.error);

      return {
        ok: false,
        message:
          "The test could not be sent. Check the active email provider in Settings → Integrations.",
      };
    }

    return {
      ok: true,
      data: { email },
    };
  } catch (error) {
    console.error("[newsletter-test] Failed:", error);

    return {
      ok: false,
      message: "Unable to send the test. Check your content and try again.",
    };
  }
}
