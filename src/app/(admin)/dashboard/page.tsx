"use client";

import { useState, useEffect, useCallback, useRef } from "react";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { MetricsRow } from "@/components/dashboard/metrics-row";
import { CampaignFilters } from "@/components/dashboard/campaign-filters";
import { CampaignsTable } from "@/components/dashboard/campaigns-table";
import { CampaignsPagination } from "@/components/dashboard/campaigns-pagination";

import {
  deleteNewsletter,
  duplicateNewsletter,
} from "@/lib/newsletter-actions";

import {
  NoCampaignsEmptyState,
  NoMatchesEmptyState,
  CampaignsErrorState,
} from "@/components/dashboard/campaign-empty-states";

import { fetchDashboardMetrics, fetchCampaigns } from "@/lib/api/dashboard";

import {
  CAMPAIGNS_PAGE_SIZE,
  type Campaign,
  type DashboardMetrics,
  type CampaignStatus,
} from "@/lib/types/dashboard";

const PAGE_SIZE = CAMPAIGNS_PAGE_SIZE;

// Must match the route of your newsletter wizard page.
const NEWSLETTER_WIZARD_PATH = "/templates/create";

const VALID_STATUSES: CampaignStatus[] = [
  "draft",
  "scheduled",
  "sending",
  "sent",
  "failed",
];

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [totalCampaigns, setTotalCampaigns] = useState(0);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [campaignsError, setCampaignsError] = useState(false);
  const [hasEverLoaded, setHasEverLoaded] = useState(false);

  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Prevent repeated mutations while one is still pending.
  const actionInProgressRef = useRef(false);

  // Ignore older campaign requests that finish after newer ones.
  const campaignRequestRef = useRef(0);

  const statusParam = searchParams.get("status");

  const status: CampaignStatus | "all" = VALID_STATUSES.includes(
    statusParam as CampaignStatus
  )
    ? (statusParam as CampaignStatus)
    : "all";

  const categoriesParam = searchParams.get("categories") ?? "";

  const categories = categoriesParam
    ? categoriesParam.split(",").filter(Boolean)
    : [];

  const search = searchParams.get("search") ?? "";

  const pageParam = Number(searchParams.get("page") ?? "1");

  const page =
    Number.isSafeInteger(pageParam) && pageParam >= 1 ? pageParam : 1;

  function updateFilters(next: {
    status?: string;
    categories?: string[];
    search?: string;
    page?: number;
  }) {
    const params = new URLSearchParams(searchParams.toString());

    if (next.status !== undefined) {
      if (next.status === "all") {
        params.delete("status");
      } else {
        params.set("status", next.status);
      }

      params.delete("page");
    }

    if (next.categories !== undefined) {
      if (next.categories.length === 0) {
        params.delete("categories");
      } else {
        params.set("categories", next.categories.join(","));
      }

      params.delete("page");
    }

    if (next.search !== undefined) {
      if (!next.search) {
        params.delete("search");
      } else {
        params.set("search", next.search);
      }

      params.delete("page");
    }

    if (next.page !== undefined) {
      if (next.page <= 1) {
        params.delete("page");
      } else {
        params.set("page", String(next.page));
      }
    }

    const query = params.toString();

    router.push(query ? `${pathname}?${query}` : pathname);
  }

  const loadCampaigns = useCallback(async () => {
    const requestId = ++campaignRequestRef.current;

    setCampaignsLoading(true);
    setCampaignsError(false);

    try {
      const data = await fetchCampaigns({
        status,
        categories: categoriesParam
          ? categoriesParam.split(",").filter(Boolean)
          : [],
        search,
        page,
      });

      if (requestId !== campaignRequestRef.current) return;

      setCampaigns(data.campaigns);
      setTotalCampaigns(data.total);
      setHasEverLoaded(true);
    } catch (error) {
      if (requestId !== campaignRequestRef.current) return;

      console.error("Failed to load campaigns:", error);
      setCampaignsError(true);
    } finally {
      if (requestId === campaignRequestRef.current) {
        setCampaignsLoading(false);
      }
    }
  }, [status, categoriesParam, search, page]);

  const refreshMetrics = useCallback(async () => {
    setMetricsLoading(true);

    try {
      const updatedMetrics = await fetchDashboardMetrics();
      setMetrics(updatedMetrics);
    } catch (error) {
      console.error("Failed to refresh dashboard metrics:", error);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialMetrics() {
      try {
        const data = await fetchDashboardMetrics();

        if (!cancelled) {
          setMetrics(data);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load dashboard metrics:", error);
          setMetrics(null);
        }
      } finally {
        if (!cancelled) {
          setMetricsLoading(false);
        }
      }
    }

    void loadInitialMetrics();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void loadCampaigns();

    return () => {
      campaignRequestRef.current += 1;
    };
  }, [loadCampaigns]);

  // Return to a valid page if deleting reduces the page count.
  useEffect(() => {
    if (campaignsLoading || campaignsError || !hasEverLoaded) {
      return;
    }

    const lastPage = Math.max(1, Math.ceil(totalCampaigns / PAGE_SIZE));

    if (page <= lastPage) return;

    const params = new URLSearchParams(searchParams.toString());

    if (lastPage === 1) {
      params.delete("page");
    } else {
      params.set("page", String(lastPage));
    }

    const query = params.toString();

    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [
    campaignsLoading,
    campaignsError,
    hasEverLoaded,
    totalCampaigns,
    page,
    searchParams,
    pathname,
    router,
  ]);

  const handleCampaignAction = async (action: string, campaign: Campaign) => {
    if (actionInProgressRef.current) return;

    // Edit opens the editor.
    // Review and Send Now open the review/confirmation step.
    if (action === "Edit" || action === "Review" || action === "Send Now") {
      if (campaign.status !== "draft") {
        window.alert(
          "This editor currently supports draft campaigns only. To reuse a sent or failed campaign, duplicate it and edit the new draft."
        );
        return;
      }

      const params = new URLSearchParams({
        campaignId: campaign.id,
      });

      if (action === "Review" || action === "Send Now") {
        params.set("mode", "review");
      }

      router.push(`${NEWSLETTER_WIZARD_PATH}?${params.toString()}`);

      return;
    }

    if (action === "Duplicate") {
      const confirmed = window.confirm(
        `Create a new draft copy of "${campaign.title}"?`
      );

      if (!confirmed) return;

      actionInProgressRef.current = true;
      setActionInProgress("Creating draft copy…");

      try {
        const result = await duplicateNewsletter(campaign.id);

        if (!result.ok) {
          window.alert(result.message);
          return;
        }

        await Promise.all([loadCampaigns(), refreshMetrics()]);

        window.alert(
          "A draft copy was created. If it is not visible, clear the dashboard filters."
        );
      } catch (error) {
        console.error("Failed to duplicate campaign:", error);

        window.alert(
          "The duplication result could not be confirmed. Check the campaign list before trying again."
        );
      } finally {
        actionInProgressRef.current = false;
        setActionInProgress(null);
      }

      return;
    }

    if (action === "Delete" || action === "Delete Campaign") {
      const confirmed = window.confirm(
        `Delete "${campaign.title}" and its delivery history? This cannot be undone.`
      );

      if (!confirmed) return;

      actionInProgressRef.current = true;
      setActionInProgress("Deleting campaign…");

      try {
        const result = await deleteNewsletter(campaign.id);

        if (!result.ok) {
          window.alert(result.message);
          return;
        }

        setCampaigns((previous) =>
          previous.filter((item) => item.id !== campaign.id)
        );

        setTotalCampaigns((previous) => Math.max(0, previous - 1));

        await Promise.all([loadCampaigns(), refreshMetrics()]);
      } catch (error) {
        console.error("Failed to delete campaign:", error);

        window.alert(
          "The deletion result could not be confirmed. Refresh the campaign list before trying again."
        );
      } finally {
        actionInProgressRef.current = false;
        setActionInProgress(null);
      }

      return;
    }

    // These features require additional pages or server actions.
    // Show an explanation instead of silently doing nothing.
    const unavailableMessages: Record<string, string> = {
      Archive:
        "Archive is not implemented yet. The database currently has no archive field or archive status.",

      "View Report": "The campaign report screen is not connected yet.",

      "View Progress": "The campaign progress screen is not connected yet.",

      Preview: "The campaign preview screen is not connected yet.",

      "Pause/Edit": "Pausing scheduled campaigns is not connected yet.",

      Reschedule: "Rescheduling is not connected yet.",

      Cancel: "Cancelling scheduled campaigns is not connected yet.",
    };

    window.alert(
      unavailableMessages[action] ??
        `The "${action}" action is not connected yet.`
    );
  };

  const hasFilters = status !== "all" || categories.length > 0 || search !== "";

  const showInitialLoading = campaignsLoading && !hasEverLoaded;

  const showNoCampaignsEmpty =
    !campaignsLoading &&
    !campaignsError &&
    campaigns.length === 0 &&
    !hasFilters;

  const showNoMatchesEmpty =
    !campaignsLoading &&
    !campaignsError &&
    campaigns.length === 0 &&
    hasFilters;

  const showCampaignsTable =
    !showInitialLoading &&
    !campaignsError &&
    !showNoCampaignsEmpty &&
    !showNoMatchesEmpty;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[32px] leading-10 font-gwc-heading font-semibold text-gwc-text-heading">
          Newsletter Campaigns
        </h1>

        <p className="mt-1 text-base text-gwc-text-body">
          Manage and track your communications to the congregation.
        </p>
      </div>

      <div className="mb-6">
        <MetricsRow
          metrics={metrics}
          isLoading={metricsLoading}
          onFilterDrafts={() => updateFilters({ status: "draft" })}
          onFilterSent={() => updateFilters({ status: "sent" })}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gwc-border/20 bg-white shadow-[0_4px_20px_rgba(0,58,93,0.05)]">
        <div className="flex flex-col gap-4 border-b border-gwc-border/20 bg-gwc-surface/80 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-xl font-gwc-heading font-semibold text-gwc-text-heading">
            Recent Campaigns
          </h2>

          <CampaignFilters
            status={status}
            categories={categories}
            search={search}
            onStatusChange={(nextStatus) =>
              updateFilters({ status: nextStatus })
            }
            onCategoriesChange={(nextCategories) =>
              updateFilters({ categories: nextCategories })
            }
            onSearchChange={(nextSearch) =>
              updateFilters({ search: nextSearch })
            }
          />
        </div>

        {actionInProgress && (
          <p
            role="status"
            className="border-b border-gwc-border/20 bg-gwc-muted-bg px-6 py-3 text-sm text-gwc-text-body"
          >
            {actionInProgress}
          </p>
        )}

        {showInitialLoading && (
          <div role="status" className="px-6 py-10 text-sm text-gwc-text-muted">
            Loading campaigns…
          </div>
        )}

        {campaignsError && !hasEverLoaded && (
          <CampaignsErrorState onRetry={loadCampaigns} />
        )}

        {campaignsError && hasEverLoaded && (
          <>
            <div className="flex items-center justify-between gap-3 px-6 pt-4">
              <p className="text-sm text-red-600">
                Couldn&apos;t refresh campaigns. Showing last loaded data.
              </p>

              <button
                type="button"
                onClick={() => {
                  void loadCampaigns();
                }}
                className="cursor-pointer text-sm font-semibold text-gwc-navy underline"
              >
                Retry
              </button>
            </div>

            <CampaignsTable
              campaigns={campaigns}
              onAction={handleCampaignAction}
            />
          </>
        )}

        {showNoCampaignsEmpty && (
          <NoCampaignsEmptyState onCreate={() => router.push("/templates")} />
        )}

        {showNoMatchesEmpty && (
          <NoMatchesEmptyState onClearFilters={() => router.push(pathname)} />
        )}

        {showCampaignsTable && (
          <>
            {campaignsLoading && (
              <p
                role="status"
                className="px-6 pt-4 text-sm text-gwc-text-muted"
              >
                Refreshing campaigns…
              </p>
            )}

            <CampaignsTable
              campaigns={campaigns}
              onAction={handleCampaignAction}
            />

            <CampaignsPagination
              page={page}
              pageSize={PAGE_SIZE}
              total={totalCampaigns}
              onPageChange={(nextPage) => updateFilters({ page: nextPage })}
            />
          </>
        )}
      </div>
    </div>
  );
}
