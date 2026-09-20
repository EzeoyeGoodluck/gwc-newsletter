"use client";

import { useState } from "react";
import {
  NewsletterAnalytics,
  AnalyticsSummary,
  EngagementPoint,
  Broadcast,
} from "@/components/analytics/newsletter-analytics";

const MOCK_SUMMARY: AnalyticsSummary = {
  totalSent: 12450,
  totalSentChange: "+12%",
  avgOpenRate: 68.4,
  avgOpenRateChange: "+5.2%",
  avgClickRate: 24.1,
  avgClickRateChange: "-0%",
  unsubscribes: 14,
  unsubscribesChange: "+2",
};

const MOCK_ENGAGEMENT: EngagementPoint[] = [
  { label: "Apr 1", opens: 65, clicks: 22 },
  { label: "Apr 5", opens: 78, clicks: 30 },
  { label: "Apr 10", opens: 62, clicks: 18 },
  { label: "Apr 15", opens: 92, clicks: 45 },
  { label: "Apr 20", opens: 75, clicks: 32 },
  { label: "Apr 25", opens: 88, clicks: 40 },
  { label: "Apr 30", opens: 84, clicks: 38 },
];

const MOCK_BROADCASTS: Broadcast[] = [
  {
    id: "1",
    subject: "Weekly Bulletin: April 14th",
    dateSent: "Apr 12, 2024",
    audience: "All Members",
    openRate: 72,
    clicks: 420,
  },
  {
    id: "2",
    subject: "Youth Retreat Registration Open!",
    dateSent: "Apr 10, 2024",
    audience: "Youth Ministry",
    openRate: 85,
    clicks: 156,
  },
  {
    id: "3",
    subject: "Volunteer Schedule for May",
    dateSent: "Apr 05, 2024",
    audience: "Volunteers",
    openRate: 64,
    clicks: 89,
  },
];

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("Last 30 Days");

  const handleExportReport = () => {
    console.log("Exporting report for", dateRange);
    // Next: generate and download a CSV/PDF export
  };

  return (
    <NewsletterAnalytics
      summary={MOCK_SUMMARY}
      engagementData={MOCK_ENGAGEMENT}
      broadcasts={MOCK_BROADCASTS}
      dateRange={dateRange}
      onDateRangeChange={setDateRange}
      onExportReport={handleExportReport}
    />
  );
}
