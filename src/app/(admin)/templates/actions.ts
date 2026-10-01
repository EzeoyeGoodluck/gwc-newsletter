"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { Template } from "@/components/templates/newsletter-templates";

type Result<T> = { ok: true; data: T } | { ok: false; message: string };

const DEFAULT_TEMPLATES = [
  {
    name: "Annual Worship & Revival",
    description:
      "Immersive worship gathering layout with event schedule, speaker details, and RSVP call-to-action.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=600",
    category: "Events",
  },
  {
    name: "Weekly Bulletin",
    description:
      "Standard layout for Sunday service order, announcements, and key contacts.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600",
    category: "General",
    isPopular: true,
  },
  {
    name: "Youth Ministry Update",
    description:
      "Vibrant design tailored for teen events, volunteer sign-ups, and parent info.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=600",
    category: "Ministry",
  },
  {
    name: "Special Event Announcement",
    description:
      "High-impact layout for conferences, holiday services, and community outreach.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=600",
    category: "Events",
  },
  {
    name: "New Member Welcome",
    description:
      "Warm, invitational sequence introducing church vision, staff, and next steps.",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600",
    category: "Onboarding",
  },
];

function updatedLabel(date: Date) {
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "Updated today";
  if (days === 1) return "Updated 1 day ago";
  if (days < 7) return `Updated ${days} days ago`;
  if (days < 30) {
    const w = Math.floor(days / 7);
    return `Updated ${w} week${w > 1 ? "s" : ""} ago`;
  }
  const m = Math.floor(days / 30);
  return `Updated ${m} month${m > 1 ? "s" : ""} ago`;
}

type TemplateRow = Awaited<ReturnType<typeof prisma.template.findMany>>[number];

function toUi(t: TemplateRow): Template {
  return {
    id: t.id,
    title: t.name,
    description: t.description ?? "",
    imageUrl: t.thumbnailUrl ?? "",
    category: t.category,
    updatedLabel: updatedLabel(t.updatedAt),
    popular: t.isPopular,
  };
}

async function ensureDefaults() {
  if ((await prisma.template.count()) === 0) {
    await prisma.template.createMany({
      data: DEFAULT_TEMPLATES.map((t) => ({ ...t, isDefault: true })),
    });
  }
}

export async function listTemplates(): Promise<Result<Template[]>> {
  await requireUser();
  await ensureDefaults();
  const rows = await prisma.template.findMany({
    orderBy: [{ isPopular: "desc" }, { updatedAt: "desc" }],
  });
  return { ok: true, data: rows.map(toUi) };
}

export async function getTemplate(
  id: string
): Promise<Result<Template | null>> {
  await requireUser();
  const row = await prisma.template.findUnique({ where: { id } });
  return { ok: true, data: row ? toUi(row) : null };
}
