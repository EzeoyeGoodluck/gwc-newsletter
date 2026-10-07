"use server";

import { Prisma, NewsletterStatus } from "@prisma/client";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
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

  const newsletter = await prisma.$transaction(async (tx) => {
    const created = await tx.newsletter.create({
      data: {
        title,
        subject: subject || title,
        category: input.category,
        status,
        sendToAll: !isGroup,
        scheduledAt: input.intent === "send" ? new Date() : scheduledAt,
        recipientCount: recipients.length,
        templateId: input.templateId || null,
        authorId: user.id,

        // Save the inbox preview and editable newsletter content.
        previewText: previewText || null,
        content: contentJson,

        // Render blocks when present; preserve the legacy text renderer otherwise.
        html:
          blocks === undefined
            ? buildHtml(subject || title, input.headerImageUrl, input.bodyText)
            : renderNewsletter(blocks, {
                subject: subject || title,
                headerImageUrl: input.headerImageUrl,
                previewText,
              }),

        groups: group ? { create: [{ groupId: group.id }] } : undefined,
      },
      select: { id: true },
    });

    if (input.intent === "send") {
      await tx.delivery.createMany({
        data: recipients.map((r) => ({
          newsletterId: created.id,
          memberId: r.id,
          email: r.email,
        })),
        skipDuplicates: true,
      });
    }

    return created;
  });

  return { ok: true, data: newsletter };
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
  await requireUser();
  await prisma.newsletter.delete({ where: { id } });
  return { ok: true, data: null };
}
