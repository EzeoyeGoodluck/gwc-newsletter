"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { MetricsRow } from "@/components/dashboard/metrics-row";
import { CampaignFilters } from "@/components/dashboard/campaign-filters";
import { CampaignsTable } from "@/components/dashboard/campaigns-table";
import { CampaignsPagination } from "@/components/dashboard/campaigns-pagination";
import { deleteNewsletter } from "@/lib/newsletter-actions";
import {
  NoCampaignsEmptyState,
  NoMatchesEmptyState,
  CampaignsErrorState,
} from "@/components/dashboard/campaign-empty-states";
import { fetchDashboardMetrics, fetchCampaigns } from "@/lib/api/dashboard";
import {
  Campaign,
  DashboardMetrics,
  CampaignStatus,
  CAMPAIGNS_PAGE_SIZE,
} from "@/lib/types/dashboard";

const PAGE_SIZE = CAMPAIGNS_PAGE_SIZE;

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

  const status =
    (searchParams.get("status") as CampaignStatus | "all") ?? "all";
  const categoriesParam = searchParams.get("categories") ?? "";
  const categories = categoriesParam ? categoriesParam.split(",") : [];
  const search = searchParams.get("search") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  function updateFilters(next: {
    status?: string;
    categories?: string[];
    search?: string;
    page?: number;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.status !== undefined) {
      if (next.status === "all") params.delete("status");
      else params.set("status", next.status);
      params.delete("page");
    }
    if (next.categories !== undefined) {
      if (next.categories.length === 0) params.delete("categories");
      else params.set("categories", next.categories.join(","));
      params.delete("page");
    }
    if (next.search !== undefined) {
      if (!next.search) params.delete("search");
      else params.set("search", next.search);
      params.delete("page");
    }
    if (next.page !== undefined) {
      if (next.page <= 1) params.delete("page");
      else params.set("page", String(next.page));
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const loadCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    setCampaignsError(false);
    try {
      const data = await fetchCampaigns({
        status,
        categories: categoriesParam ? categoriesParam.split(",") : [],
        search,
        page,
      });
      setCampaigns(data.campaigns);
      setTotalCampaigns(data.total);
      setHasEverLoaded(true);
    } catch {
      setCampaignsError(true);
    } finally {
      setCampaignsLoading(false);
    }
  }, [status, categoriesParam, search, page]);

  useEffect(() => {
    fetchDashboardMetrics()
      .then(setMetrics)
      .catch(() => setMetrics(null))
      .finally(() => setMetricsLoading(false));
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  const hasFilters = status !== "all" || categories.length > 0 || search !== "";
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

  const handleCampaignAction = async (action: string, campaign: Campaign) => {
    if (action !== "Delete" && action !== "Delete Campaign") {
      console.log(action, campaign);
      return;
    }

    const confirmed = window.confirm(
      `Delete "${campaign.title}"? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const res = await deleteNewsletter(campaign.id);

      if (!res.ok) {
        window.alert(res.message);
        return;
      }

      // Remove the successfully deleted campaign from the visible list.
      setCampaigns((previous) =>
        previous.filter((item) => item.id !== campaign.id)
      );

      setTotalCampaigns((previous) => Math.max(0, previous - 1));

      // Refresh the campaign list from its API.
      await loadCampaigns();

      // Refresh the dashboard totals.
      try {
        const updatedMetrics = await fetchDashboardMetrics();
        setMetrics(updatedMetrics);
      } catch (error) {
        console.error(
          "Campaign deleted, but dashboard metrics could not refresh:",
          error
        );
      }
    } catch (error) {
      console.error("Failed to delete campaign:", error);
      window.alert("Unable to delete the campaign. Please try again.");
    }
  };
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[32px] leading-10 font-gwc-heading font-semibold text-gwc-text-heading">
          Newsletter Campaigns
        </h1>
        <p className="text-base text-gwc-text-body mt-1">
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

      <div className="bg-white rounded-xl border border-gwc-border/20 shadow-[0_4px_20px_rgba(0,58,93,0.05)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-6 bg-gwc-surface/80 border-b border-gwc-border/20">
          <h2 className="text-xl font-gwc-heading font-semibold text-gwc-text-heading">
            Recent Campaigns
          </h2>
          <CampaignFilters
            status={status}
            categories={categories}
            search={search}
            onStatusChange={(s) => updateFilters({ status: s })}
            onCategoriesChange={(c) => updateFilters({ categories: c })}
            onSearchChange={(s) => updateFilters({ search: s })}
          />
        </div>

        {campaignsError && !hasEverLoaded && (
          <CampaignsErrorState onRetry={loadCampaigns} />
        )}
        {campaignsError && hasEverLoaded && (
          <>
            <p className="text-sm text-red-600 px-6 pt-4">
              Couldn&apos;t refresh campaigns. Showing last loaded data.
            </p>
            <CampaignsTable
              campaigns={campaigns}
              onAction={handleCampaignAction}
            />
          </>
        )}
        {!campaignsError && showNoCampaignsEmpty && (
          <NoCampaignsEmptyState onCreate={() => router.push("/templates")} />
        )}
        {!campaignsError && showNoMatchesEmpty && (
          <NoMatchesEmptyState onClearFilters={() => router.push(pathname)} />
        )}
        {!campaignsError && !showNoCampaignsEmpty && !showNoMatchesEmpty && (
          <>
            <CampaignsTable
              campaigns={campaigns}
              onAction={handleCampaignAction}
            />
            <CampaignsPagination
              page={page}
              pageSize={PAGE_SIZE}
              total={totalCampaigns}
              onPageChange={(p) => updateFilters({ page: p })}
            />
          </>
        )}
      </div>
    </div>
  );
}
