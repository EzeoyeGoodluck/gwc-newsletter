import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/api-auth";
import type { DashboardMetrics } from "@/lib/types/dashboard";

export async function GET(request: Request) {
  const { error } = await requireApiPermission(request, "dashboard.view");
  if (error) return error;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [activeDrafts, sentThisMonth, totalRecipients, newThisMonth] =
    await Promise.all([
      prisma.newsletter.count({ where: { status: "DRAFT" } }),
      prisma.newsletter.count({
        where: { status: "SENT", sentAt: { gte: startOfMonth } },
      }),
      prisma.member.count({ where: { status: "SUBSCRIBED" } }),
      prisma.member.count({
        where: { status: "SUBSCRIBED", createdAt: { gte: startOfMonth } },
      }),
    ]);

  const previousTotal = totalRecipients - newThisMonth;
  const recipientsChangePercent =
    previousTotal > 0
      ? Math.round((newThisMonth / previousTotal) * 1000) / 10
      : undefined;

  const body: DashboardMetrics = {
    activeDrafts,
    sentThisMonth,
    totalRecipients,
    recipientsChangePercent,
  };

  return NextResponse.json(body);
}
