import { NextResponse } from "next/server";
import { Prisma, type NewsletterStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/api-auth";
import {
  CAMPAIGNS_PAGE_SIZE,
  type Campaign,
  type CampaignStatus,
  type CampaignsResponse,
} from "@/lib/types/dashboard";

const PAGE_SIZE = CAMPAIGNS_PAGE_SIZE;

const STATUS_TO_DB: Record<CampaignStatus, NewsletterStatus[]> = {
  draft: ["DRAFT", "FAILED"],
  scheduled: ["SCHEDULED", "SENDING"],
  sent: ["SENT"],
};

function toUiStatus(status: NewsletterStatus): CampaignStatus {
  if (status === "SENT") return "sent";
  if (status === "SCHEDULED" || status === "SENDING") return "scheduled";
  return "draft";
}

export async function GET(request: Request) {
  const { error } = await requireApiPermission(request, "newsletters.view");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const categories = (searchParams.get("categories") ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  const search = (searchParams.get("search") ?? "").trim();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const where: Prisma.NewsletterWhereInput = {};

  if (status && status in STATUS_TO_DB) {
    where.status = { in: STATUS_TO_DB[status as CampaignStatus] };
  }
  if (categories.length > 0) {
    where.category = { in: categories };
  }
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { subject: { contains: search } },
    ];
  }

  const [total, rows] = await prisma.$transaction([
    prisma.newsletter.count({ where }),
    prisma.newsletter.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        status: true,
        category: true,
        updatedAt: true,
      },
    }),
  ]);

  const campaigns: Campaign[] = rows.map((n) => ({
    id: n.id,
    campaignId: `NL-${n.id.slice(-6).toUpperCase()}`,
    title: n.title,
    status: toUiStatus(n.status),
    category: n.category ?? "General",
    lastEdited: n.updatedAt.toISOString(),
  }));

  const body: CampaignsResponse = {
    campaigns,
    total,
    page,
    pageSize: PAGE_SIZE,
  };
  return NextResponse.json(body);
}
