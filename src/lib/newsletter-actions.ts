"use server";

import { Prisma, NewsletterStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

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
};

export async function saveNewsletter(
  input: SaveNewsletterInput
): Promise<Result<{ id: string }>> {
  const user = await requireUser();

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
        content: {
          audience: input.audience,
          headerImageUrl: input.headerImageUrl,
          bodyText: input.bodyText,
        },
        html: buildHtml(subject || title, input.headerImageUrl, input.bodyText),
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
  status: "draft" | "scheduled" | "sent";
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
      const status: CampaignRow["status"] =
        n.status === "DRAFT"
          ? "draft"
          : n.status === "SCHEDULED"
            ? "scheduled"
            : "sent";
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
