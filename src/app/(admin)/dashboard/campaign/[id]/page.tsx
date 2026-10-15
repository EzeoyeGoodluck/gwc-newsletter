import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { can } from "@/lib/permissions";

export const dynamic = "force-dynamic";

type CampaignDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    view?: string | string[];
  }>;
};

function formatDate(value: Date | null): string {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(value);
}

function statusLabel(value: string): string {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  SCHEDULED: "bg-blue-50 text-blue-700",
  SENDING: "bg-amber-50 text-amber-700",
  SENT: "bg-emerald-50 text-emerald-700",
  FAILED: "bg-red-50 text-red-700",
  BOUNCED: "bg-orange-50 text-orange-700",
  QUEUED: "bg-slate-100 text-slate-700",
};

export default async function CampaignDetailPage({
  params,
  searchParams,
}: CampaignDetailPageProps) {
  const user = await requireUser();

  if (!can(user.role, "newsletters.view")) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const query = await searchParams;
  const showPreview = query.view === "preview";

  const campaign = await prisma.newsletter.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      subject: true,
      previewText: true,
      category: true,
      status: true,
      content: true,
      html: true,
      createdAt: true,
      updatedAt: true,
      scheduledAt: true,
      sentAt: true,
    },
  });

  if (!campaign) {
    notFound();
  }

  const [deliveryGroups, recentDeliveries, claimedQueuedCount] =
    await Promise.all([
      prisma.delivery.groupBy({
        by: ["status"],
        where: {
          newsletterId: campaign.id,
        },
        _count: {
          _all: true,
        },
      }),

      prisma.delivery.findMany({
        where: {
          newsletterId: campaign.id,
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 50,
        select: {
          id: true,
          email: true,
          status: true,
          error: true,
          processingAt: true,
          sentAt: true,
        },
      }),

      prisma.delivery.count({
        where: {
          newsletterId: campaign.id,
          status: "QUEUED",
          processingAt: {
            not: null,
          },
        },
      }),
    ]);

  const counts = {
    QUEUED: 0,
    SENT: 0,
    FAILED: 0,
    BOUNCED: 0,
  };

  for (const group of deliveryGroups) {
    counts[group.status] = group._count._all;
  }

  const total = counts.QUEUED + counts.SENT + counts.FAILED + counts.BOUNCED;

  const completed = counts.SENT + counts.FAILED + counts.BOUNCED;

  const completionPercent =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  const content =
    campaign.content &&
    typeof campaign.content === "object" &&
    !Array.isArray(campaign.content)
      ? (campaign.content as Record<string, unknown>)
      : {};

  const audience =
    typeof content.audience === "string" ? content.audience : "Not recorded";

  const campaignPath = `/dashboard/campaign/${encodeURIComponent(campaign.id)}`;

  const canEdit =
    campaign.status === "DRAFT" && can(user.role, "newsletters.edit");

  const canPublish =
    campaign.status === "DRAFT" && can(user.role, "newsletters.publish");

  const stats = [
    {
      label: "Total delivery records",
      value: total,
      color: "text-gwc-navy",
    },
    {
      label: "Submitted to SMTP",
      value: counts.SENT,
      color: "text-emerald-700",
    },
    {
      label: "Queued",
      value: counts.QUEUED,
      color: "text-amber-700",
    },
    {
      label: "Failed / excluded",
      value: counts.FAILED,
      color: "text-red-700",
    },
    {
      label: "Bounced",
      value: counts.BOUNCED,
      color: "text-orange-700",
    },
  ];

  return (
    <div className="space-y-6 text-gwc-navy">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/dashboard"
            className="text-sm text-gwc-text-muted hover:text-gwc-navy"
          >
            ← Back to campaigns
          </Link>

          <h1 className="mt-3 break-words font-gwc-heading text-2xl font-semibold">
            {campaign.title}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                statusColors[campaign.status] ?? "bg-slate-100 text-slate-700"
              }`}
            >
              {statusLabel(campaign.status)}
            </span>

            <p className="text-sm text-gwc-text-muted">
              {showPreview
                ? "Saved newsletter preview"
                : campaign.status === "SENDING"
                  ? "Campaign progress"
                  : "Campaign report"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Link
              href={`/templates/create?campaignId=${encodeURIComponent(
                campaign.id
              )}`}
              className="rounded-lg border border-gwc-border/40 bg-white px-4 py-2 text-sm font-semibold"
            >
              Edit draft
            </Link>
          )}

          {canPublish && (
            <Link
              href={`/templates/create?campaignId=${encodeURIComponent(
                campaign.id
              )}&mode=review`}
              className="rounded-lg bg-gwc-navy px-4 py-2 text-sm font-semibold text-white"
            >
              Review before sending
            </Link>
          )}

          <Link
            href={showPreview ? `${campaignPath}?view=preview` : campaignPath}
            prefetch={false}
            className="rounded-lg border border-gwc-border/40 bg-white px-4 py-2 text-sm font-semibold"
          >
            Refresh
          </Link>
        </div>
      </header>

      <nav
        aria-label="Campaign details"
        className="flex gap-2 border-b border-gwc-border/20 pb-3"
      >
        <Link
          href={campaignPath}
          aria-current={!showPreview ? "page" : undefined}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            !showPreview ? "bg-gwc-navy text-white" : "bg-white text-gwc-navy"
          }`}
        >
          Report &amp; progress
        </Link>

        <Link
          href={`${campaignPath}?view=preview`}
          aria-current={showPreview ? "page" : undefined}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            showPreview ? "bg-gwc-navy text-white" : "bg-white text-gwc-navy"
          }`}
        >
          Preview
        </Link>
      </nav>

      <section className="rounded-xl border border-gwc-border/20 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Campaign details</h2>

        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div className="min-w-0">
            <dt className="text-xs text-gwc-text-muted">Subject</dt>
            <dd className="mt-1 break-words font-medium">{campaign.subject}</dd>
          </div>

          <div>
            <dt className="text-xs text-gwc-text-muted">Audience</dt>
            <dd className="mt-1">{audience}</dd>
          </div>

          <div>
            <dt className="text-xs text-gwc-text-muted">Category</dt>
            <dd className="mt-1">{campaign.category || "General"}</dd>
          </div>

          <div>
            <dt className="text-xs text-gwc-text-muted">Created · UTC</dt>
            <dd className="mt-1">{formatDate(campaign.createdAt)}</dd>
          </div>

          <div>
            <dt className="text-xs text-gwc-text-muted">Last updated · UTC</dt>
            <dd className="mt-1">{formatDate(campaign.updatedAt)}</dd>
          </div>

          <div>
            <dt className="text-xs text-gwc-text-muted">Marked sent · UTC</dt>
            <dd className="mt-1">{formatDate(campaign.sentAt)}</dd>
          </div>
        </dl>
      </section>

      {showPreview ? (
        <section className="overflow-hidden rounded-xl border border-gwc-border/20 bg-white shadow-sm">
          <div className="border-b border-gwc-border/20 p-4">
            <h2 className="text-sm font-semibold">Saved newsletter preview</h2>

            <p className="mt-1 text-xs leading-5 text-gwc-text-muted">
              This is the saved HTML, not an individual recipient’s delivered
              email. Personalisation placeholders may remain visible. External
              images may load.
            </p>
          </div>

          {campaign.html?.trim() ? (
            <iframe
              title={`Saved preview of ${campaign.title}`}
              srcDoc={campaign.html}
              sandbox=""
              referrerPolicy="no-referrer"
              className="h-[1000px] w-full border-0 bg-slate-50"
            />
          ) : (
            <p className="p-6 text-sm text-gwc-text-muted">
              This campaign has no saved HTML preview.
            </p>
          )}
        </section>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {stats.map((stat) => (
              <section
                key={stat.label}
                className="rounded-xl border border-gwc-border/20 bg-white p-5 shadow-sm"
              >
                <h2 className="text-xs text-gwc-text-muted">{stat.label}</h2>

                <p className={`mt-3 text-3xl font-semibold ${stat.color}`}>
                  {stat.value.toLocaleString("en-GB")}
                </p>
              </section>
            ))}
          </div>

          <section className="rounded-xl border border-gwc-border/20 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">
                Recorded processing progress
              </h2>

              <span className="text-sm text-gwc-text-muted">
                {completed.toLocaleString("en-GB")} /{" "}
                {total.toLocaleString("en-GB")} complete
              </span>
            </div>

            <progress
              max={100}
              value={completionPercent}
              aria-label="Recorded delivery processing progress"
              className="mt-4 h-3 w-full accent-[#002B3D]"
            />

            <p className="mt-3 text-xs leading-5 text-gwc-text-muted">
              “Submitted to SMTP” means the sending provider accepted the
              submission. It does not confirm inbox delivery. Failed / excluded
              includes recipients suppressed by eligibility checks. Progress
              updates when you refresh this page.
            </p>

            {total === 0 && (
              <p className="mt-3 text-sm text-gwc-text-muted">
                No delivery records have been created for this campaign.
              </p>
            )}

            {claimedQueuedCount > 0 && (
              <div
                role="status"
                className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800"
              >
                {claimedQueuedCount} queued delivery record(s) have been claimed
                for processing. They may be in progress or may require
                investigation after an interrupted run. Do not blindly resend
                them.
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-xl border border-gwc-border/20 bg-white shadow-sm">
            <div className="border-b border-gwc-border/20 p-5">
              <h2 className="text-sm font-semibold">Delivery records</h2>

              <p className="mt-1 text-xs text-gwc-text-muted">
                Showing up to 50 most recently created records. Summary counts
                above cover all delivery records.
              </p>
            </div>

            {recentDeliveries.length === 0 ? (
              <p className="p-6 text-sm text-gwc-text-muted">
                There are no delivery records to display.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs text-gwc-text-muted">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Email</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold">
                        Submitted · UTC
                      </th>
                      <th className="px-5 py-3 font-semibold">Details</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gwc-border/20">
                    {recentDeliveries.map((delivery) => (
                      <tr key={delivery.id}>
                        <td className="break-all px-5 py-4">
                          {delivery.email}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                              statusColors[delivery.status] ??
                              "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {statusLabel(delivery.status)}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-gwc-text-muted">
                          {formatDate(delivery.sentAt)}
                        </td>

                        <td className="min-w-[220px] max-w-md break-words px-5 py-4 text-xs leading-5 text-gwc-text-muted">
                          {delivery.error ||
                            (delivery.status === "QUEUED" &&
                            delivery.processingAt
                              ? "Claimed for processing; result not yet recorded."
                              : "—")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
