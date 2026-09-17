import {
  DashboardMetrics,
  CampaignsResponse,
  CampaignsQuery,
} from "@/lib/types/dashboard";

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const res = await fetch("/api/dashboard/metrics", {
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error("Failed to load dashboard metrics");
  return res.json();
}

export async function fetchCampaigns(
  query: CampaignsQuery
): Promise<CampaignsResponse> {
  const params = new URLSearchParams();
  if (query.status && query.status !== "all")
    params.set("status", query.status);
  if (query.categories?.length)
    params.set("categories", query.categories.join(","));
  if (query.search) params.set("search", query.search);
  if (query.page) params.set("page", String(query.page));

  const res = await fetch(`/api/campaigns?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to load campaigns");
  return res.json();
}
