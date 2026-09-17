"use client";

import { FileEdit, MailCheck, Users } from "lucide-react";
import { KPICard } from "@/components/dashboard/kpi-card";
import { DashboardMetrics } from "@/lib/types/dashboard";
import { useRouter } from "next/navigation";

interface MetricsRowProps {
  metrics: DashboardMetrics | null;
  isLoading: boolean;
  onFilterDrafts: () => void;
  onFilterSent: () => void;
}

export function MetricsRow({
  metrics,
  isLoading,
  onFilterDrafts,
  onFilterSent,
}: MetricsRowProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-40 bg-gwc-border/20 rounded-gwc-card animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      <KPICard
        icon={FileEdit}
        badge="Requires Action"
        label="Active Drafts"
        value={metrics?.activeDrafts ?? 0}
        onClick={onFilterDrafts}
      />
      <KPICard
        icon={MailCheck}
        badge="This Month"
        label="Sent Campaigns"
        value={metrics?.sentThisMonth ?? 0}
        onClick={onFilterSent}
        watermarkIcon={MailCheck}
      />
      <KPICard
        icon={Users}
        variant="gold"
        badge={
          metrics?.recipientsChangePercent
            ? `+${metrics.recipientsChangePercent}% vs Last Mo`
            : undefined
        }
        label="Total Recipients Reached"
        value={metrics?.totalRecipients ?? 0}
        onClick={() => router.push("/analytics")}
      />
    </div>
  );
}
