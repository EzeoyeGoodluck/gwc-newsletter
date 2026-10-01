"use client";

import { useEffect, useState } from "react";
import {
  NewsletterAnalytics,
  AnalyticsSummary,
  EngagementPoint,
  Broadcast,
} from "@/components/analytics/newsletter-analytics";

const EMPTY_SUMMARY: AnalyticsSummary = {
  totalSent: 0,
  totalSentChange: "0%",
  avgOpenRate: 0,
  avgOpenRateChange: "0%",
  avgClickRate: 0,
  avgClickRateChange: "0%",
  unsubscribes: 0,
  unsubscribesChange: "+0",
};

const EMPTY_ENGAGEMENT: EngagementPoint[] = Array.from(
  { length: 7 },
  (_, i) => ({
    label: "",
    opens: 0,
    clicks: 0,
  })
);

type AnalyticsResponse = {
  summary: AnalyticsSummary;
  engagement: EngagementPoint[];
  broadcasts: Broadcast[];
};

function toCsv(rows: (string | number)[][]) {
  return rows
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    fetch(`/api/analytics?range=${encodeURIComponent(dateRange)}`, {
      cache: "no-store",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load analytics");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [dateRange]);

  const handleExportReport = () => {
    if (!data) return;
    const s = data.summary;
    const csv = toCsv([
      ["Glory Worship Church — Newsletter Analytics", dateRange],
      [],
      ["Metric", "Value", "Change"],
      ["Total Sent", s.totalSent, s.totalSentChange],
      ["Avg. Open Rate", `${s.avgOpenRate}%`, s.avgOpenRateChange],
      ["Avg. Click Rate", `${s.avgClickRate}%`, s.avgClickRateChange],
      ["Unsubscribes", s.unsubscribes, s.unsubscribesChange],
      [],
      ["Subject", "Date Sent", "Audience", "Open Rate", "Clicks"],
      ...data.broadcasts.map((b) => [
        b.subject,
        b.dateSent,
        b.audience,
        `${b.openRate}%`,
        b.clicks,
      ]),
    ]);

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${dateRange.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <NewsletterAnalytics
        summary={data?.summary ?? EMPTY_SUMMARY}
        engagementData={data?.engagement ?? EMPTY_ENGAGEMENT}
        broadcasts={data?.broadcasts ?? []}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        onExportReport={handleExportReport}
      />
    </>
  );
}
