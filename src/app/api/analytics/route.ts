import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/api-auth";
import type {
  AnalyticsSummary,
  EngagementPoint,
  Broadcast,
} from "@/components/analytics/newsletter-analytics";

const DAY = 86_400_000;

function rangeStart(range: string, now: Date): Date {
  switch (range) {
    case "Last 7 Days":
      return new Date(now.getTime() - 7 * DAY);
    case "Last 90 Days":
      return new Date(now.getTime() - 90 * DAY);
    case "This Year":
      return new Date(now.getFullYear(), 0, 1);
    default:
      return new Date(now.getTime() - 30 * DAY);
  }
}

const pct = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;

function changeLabel(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+100%" : "0%";
  const diff = Math.round(((current - previous) / previous) * 1000) / 10;
  return `${diff >= 0 ? "+" : ""}${diff}%`;
}

function pointChange(current: number, previous: number): string {
  const diff = Math.round((current - previous) * 10) / 10;
  return `${diff >= 0 ? "+" : ""}${diff}%`;
}

async function periodStats(from: Date, to: Date) {
  const sentWhere = { status: "SENT" as const, sentAt: { gte: from, lt: to } };
  const [sent, opened, clicked, unsubscribes] = await Promise.all([
    prisma.delivery.count({ where: sentWhere }),
    prisma.delivery.count({ where: { ...sentWhere, openedAt: { not: null } } }),
    prisma.delivery.count({
      where: { ...sentWhere, clickedAt: { not: null } },
    }),
    prisma.member.count({ where: { unsubscribedAt: { gte: from, lt: to } } }),
  ]);
  return {
    sent,
    openRate: pct(opened, sent),
    clickRate: pct(clicked, sent),
    unsubscribes,
  };
}

export async function GET(request: Request) {
  const { error } = await requireApiPermission(request, "dashboard.view");
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") ?? "Last 30 Days";

  const now = new Date();
  const from = rangeStart(range, now);
  const length = now.getTime() - from.getTime();
  const prevFrom = new Date(from.getTime() - length);

  // ── Summary cards ──
  const [current, previous] = await Promise.all([
    periodStats(from, now),
    periodStats(prevFrom, from),
  ]);

  const unsubDiff = current.unsubscribes - previous.unsubscribes;
  const summary: AnalyticsSummary = {
    totalSent: current.sent,
    totalSentChange: changeLabel(current.sent, previous.sent),
    avgOpenRate: current.openRate,
    avgOpenRateChange: pointChange(current.openRate, previous.openRate),
    avgClickRate: current.clickRate,
    avgClickRateChange: pointChange(current.clickRate, previous.clickRate),
    unsubscribes: current.unsubscribes,
    unsubscribesChange: `${unsubDiff >= 0 ? "+" : ""}${unsubDiff}`,
  };

  // ── Engagement chart: 7 buckets across the range ──
  const deliveries = await prisma.delivery.findMany({
    where: { status: "SENT", sentAt: { gte: from, lt: now } },
    select: { sentAt: true, openedAt: true, clickedAt: true },
  });

  const BUCKETS = 7;
  const size = length / BUCKETS;
  const buckets = Array.from({ length: BUCKETS }, () => ({
    sent: 0,
    opens: 0,
    clicks: 0,
  }));

  for (const d of deliveries) {
    if (!d.sentAt) continue;
    const i = Math.min(
      BUCKETS - 1,
      Math.floor((d.sentAt.getTime() - from.getTime()) / size)
    );
    buckets[i].sent++;
    if (d.openedAt) buckets[i].opens++;
    if (d.clickedAt) buckets[i].clicks++;
  }

  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  const engagement: EngagementPoint[] = buckets.map((b, i) => ({
    label: fmt.format(new Date(from.getTime() + size * (i + 1))),
    opens: pct(b.opens, b.sent),
    clicks: pct(b.clicks, b.sent),
  }));

  // ── Recent broadcasts ──
  const newsletters = await prisma.newsletter.findMany({
    where: { status: { in: ["SENT", "SENDING"] }, sentAt: { gte: from } },
    orderBy: { sentAt: "desc" },
    take: 5,
    select: {
      id: true,
      subject: true,
      sentAt: true,
      sendToAll: true,
      content: true,
    },
  });

  const ids = newsletters.map((n) => n.id);
  const [sentCounts, openCounts, clickCounts] = await Promise.all([
    prisma.delivery.groupBy({
      by: ["newsletterId"],
      where: { newsletterId: { in: ids }, status: "SENT" },
      _count: { _all: true },
    }),
    prisma.delivery.groupBy({
      by: ["newsletterId"],
      where: { newsletterId: { in: ids }, openedAt: { not: null } },
      _count: { _all: true },
    }),
    prisma.delivery.groupBy({
      by: ["newsletterId"],
      where: { newsletterId: { in: ids }, clickedAt: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const countFor = (
    rows: { newsletterId: string; _count: { _all: number } }[],
    id: string
  ) => rows.find((r) => r.newsletterId === id)?._count._all ?? 0;

  const dateFmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  const broadcasts: Broadcast[] = newsletters.map((n) => {
    const sent = countFor(sentCounts, n.id);
    const audience = (n.content as { audience?: string } | null)?.audience;
    return {
      id: n.id,
      subject: n.subject,
      dateSent: n.sentAt ? dateFmt.format(n.sentAt) : "—",
      audience: audience ?? (n.sendToAll ? "All Members" : "Group"),
      openRate: Math.round(pct(countFor(openCounts, n.id), sent)),
      clicks: countFor(clickCounts, n.id),
    };
  });

  return NextResponse.json({ summary, engagement, broadcasts });
}
