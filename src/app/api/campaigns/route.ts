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
  draft: ["DRAFT"],
  scheduled: ["SCHEDULED"],
  sending: ["SENDING"],
  sent: ["SENT"],
  failed: ["FAILED"],
};

const DB_TO_STATUS: Record<NewsletterStatus, CampaignStatus> = {
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  SENDING: "sending",
  SENT: "sent",
  FAILED: "failed",
};

function isCampaignStatus(value: string): value is CampaignStatus {
  return Object.prototype.hasOwnProperty.call(STATUS_TO_DB, value);
}

export async function GET(request: Request) {
  const { error } = await requireApiPermission(request, "newsletters.view");

  if (error) return error;

  const { searchParams } = new URL(request.url);

  const status = searchParams.get("status");

  const categories = (searchParams.get("categories") ?? "")
    .split(",")
    .map((category) => category.trim())
    .filter(Boolean);

  const search = (searchParams.get("search") ?? "").trim();

  const rawPage = Number(searchParams.get("page") ?? "1");

  const page = Number.isSafeInteger(rawPage) && rawPage >= 1 ? rawPage : 1;

  if (status && status !== "all" && !isCampaignStatus(status)) {
    return NextResponse.json(
      { message: "Invalid campaign status filter." },
      { status: 400 }
    );
  }

  const where: Prisma.NewsletterWhereInput = {};

  if (status && isCampaignStatus(status)) {
    where.status = {
      in: STATUS_TO_DB[status],
    };
  }

  if (categories.length > 0) {
    where.category = {
      in: categories,
    };
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { subject: { contains: search } },
    ];
  }

  try {
    const [total, rows] = await prisma.$transaction([
      prisma.newsletter.count({ where }),

      prisma.newsletter.findMany({
        where,
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
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

    const campaigns: Campaign[] = rows.map((newsletter) => ({
      id: newsletter.id,
      campaignId: `NL-${newsletter.id.slice(-6).toUpperCase()}`,
      title: newsletter.title,
      status: DB_TO_STATUS[newsletter.status],
      category: newsletter.category ?? "General",
      lastEdited: newsletter.updatedAt.toISOString(),
    }));

    const body: CampaignsResponse = {
      campaigns,
      total,
      page,
      pageSize: PAGE_SIZE,
    };

    return NextResponse.json(body);
  } catch (error) {
    console.error("[campaigns] Failed to load campaigns:", error);

    return NextResponse.json(
      { message: "Unable to load campaigns." },
      { status: 500 }
    );
  }
}
