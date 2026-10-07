import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiPermission } from "@/lib/api-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { error } = await requireApiPermission(request, "newsletters.view");

  if (error) return error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id")?.trim();

  if (!id) {
    return NextResponse.json(
      {
        error: "Provide the newsletter database ID using ?id=...",
      },
      { status: 400 }
    );
  }

  try {
    const newsletter = await prisma.newsletter.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        subject: true,
        status: true,
        scheduledAt: true,
        sentAt: true,
        recipientCount: true,
        sentCount: true,
        failedCount: true,
        html: true,
      },
    });

    if (!newsletter) {
      return NextResponse.json(
        { error: "Campaign not found." },
        { status: 404 }
      );
    }

    const [deliveryCounts, activeProvider] = await Promise.all([
      prisma.delivery.groupBy({
        by: ["status"],
        where: { newsletterId: id },
        _count: { _all: true },
      }),

      prisma.emailProvider.findFirst({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          batchSize: true,
          batchDelaySec: true,
          maxPerHour: true,
          maxPerDay: true,
        },
      }),
    ]);

    const deliveries = {
      queued: 0,
      sent: 0,
      failed: 0,
      bounced: 0,
    };

    for (const row of deliveryCounts) {
      switch (row.status) {
        case "QUEUED":
          deliveries.queued = row._count._all;
          break;
        case "SENT":
          deliveries.sent = row._count._all;
          break;
        case "FAILED":
          deliveries.failed = row._count._all;
          break;
        case "BOUNCED":
          deliveries.bounced = row._count._all;
          break;
      }
    }

    const totalDeliveries =
      deliveries.queued +
      deliveries.sent +
      deliveries.failed +
      deliveries.bounced;

    const now = new Date();

    const scheduledAndDue =
      newsletter.status === "SCHEDULED" &&
      newsletter.scheduledAt !== null &&
      newsletter.scheduledAt <= now;

    const warnings: string[] = [];

    if (!activeProvider) {
      warnings.push("No active SMTP provider is configured.");
    }

    if (!newsletter.html?.trim()) {
      warnings.push("The campaign has no saved email HTML.");
    }

    if (newsletter.status === "SENDING" && deliveries.queued > 0) {
      warnings.push(
        "This campaign has queued deliveries. A processor must send them."
      );
    }

    if (newsletter.status === "SENDING" && totalDeliveries === 0) {
      warnings.push(
        "This campaign is marked SENDING but has no delivery records."
      );
    }

    if (
      newsletter.status === "SENDING" &&
      totalDeliveries > 0 &&
      deliveries.queued === 0
    ) {
      warnings.push(
        "No queued deliveries remain. Check whether campaign finalization updated its status."
      );
    }

    if (scheduledAndDue) {
      warnings.push(
        "The scheduled time has passed. Check the scheduler and delivery preparation."
      );
    }

    return NextResponse.json(
      {
        campaign: {
          id: newsletter.id,
          title: newsletter.title,
          subject: newsletter.subject,
          status: newsletter.status,
          scheduledAt: newsletter.scheduledAt,
          sentAt: newsletter.sentAt,
          recipientCount: newsletter.recipientCount,
          recordedSentCount: newsletter.sentCount,
          recordedFailedCount: newsletter.failedCount,
          hasHtml: Boolean(newsletter.html?.trim()),
        },
        deliveries: {
          ...deliveries,
          total: totalDeliveries,
        },
        activeProvider,
        serverTime: now.toISOString(),
        scheduledAndDue,
        warnings,
        sendsEmail: false,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("[queue-status] Inspection failed:", error);

    return NextResponse.json(
      { error: "Unable to inspect the campaign queue." },
      { status: 500 }
    );
  }
}
