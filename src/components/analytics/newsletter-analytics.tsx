"use client";

import { useState } from "react";
import {
  Send,
  Mail,
  MousePointerClick,
  UserMinus,
  Calendar,
  Download,
  ChevronDown,
} from "lucide-react";

export interface AnalyticsSummary {
  totalSent: number;
  totalSentChange: string;
  avgOpenRate: number;
  avgOpenRateChange: string;
  avgClickRate: number;
  avgClickRateChange: string;
  unsubscribes: number;
  unsubscribesChange: string;
}

export interface EngagementPoint {
  label: string;
  opens: number;
  clicks: number;
}

export interface Broadcast {
  id: string;
  subject: string;
  dateSent: string;
  audience: string;
  openRate: number;
  clicks: number;
}

interface NewsletterAnalyticsProps {
  summary: AnalyticsSummary;
  engagementData: EngagementPoint[];
  broadcasts: Broadcast[];
  dateRange: string;
  onDateRangeChange: (range: string) => void;
  onExportReport: () => void;
}

function StatCard({
  icon,
  label,
  value,
  change,
  changeTone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  changeTone: "up" | "down";
}) {
  return (
    <div className="bg-white rounded-xl border border-gwc-border/20 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="h-9 w-9 rounded-lg bg-gwc-muted-bg flex items-center justify-center text-gwc-navy">
          {icon}
        </div>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full ${
            changeTone === "up"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {change}
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold text-gwc-navy">{value}</p>
        <p className="text-xs text-gwc-text-muted uppercase tracking-wide mt-1">
          {label}
        </p>
      </div>
    </div>
  );
}

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  let path = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return path;
}

function EngagementChart({ data }: { data: EngagementPoint[] }) {
  const width = 900;
  const height = 220;
  const padding = 32;
  const maxVal = 100;

  const getPoints = (key: "opens" | "clicks") =>
    data.map((d, i) => ({
      x: padding + (i / (data.length - 1)) * (width - padding * 2),
      y: height - padding - (d[key] / maxVal) * (height - padding * 2),
    }));

  const opensPoints = getPoints("opens");
  const clicksPoints = getPoints("clicks");
  const opensPath = buildSmoothPath(opensPoints);
  const clicksPath = buildSmoothPath(clicksPoints);
  const baseline = height - padding;

  const opensAreaPath = `${opensPath} L ${opensPoints[opensPoints.length - 1].x},${baseline} L ${opensPoints[0].x},${baseline} Z`;
  const clicksAreaPath = `${clicksPath} L ${clicksPoints[clicksPoints.length - 1].x},${baseline} L ${clicksPoints[0].x},${baseline} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height + 24}`}
        className="w-full h-auto min-w-[600px]"
      >
        <defs>
          <linearGradient id="opensGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00243C" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#00243C" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="clicksGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7FA3CD" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#7FA3CD" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0, 25, 50, 75, 100].map((v) => {
          const y = height - padding - (v / maxVal) * (height - padding * 2);
          return (
            <g key={v}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#E5E9EF"
                strokeWidth={1}
              />
              <text x={4} y={y + 4} fontSize="10" fill="#8A94A6">
                {v}
              </text>
            </g>
          );
        })}

        <path d={clicksAreaPath} fill="url(#clicksGradient)" stroke="none" />
        <path d={opensAreaPath} fill="url(#opensGradient)" stroke="none" />

        <path
          d={clicksPath}
          fill="none"
          stroke="#7FA3CD"
          strokeWidth={2}
          strokeDasharray="5,4"
          strokeLinecap="round"
        />
        <path
          d={opensPath}
          fill="none"
          stroke="#00243C"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {data.map((d, i) => (
          <g key={i}>
            <circle
              cx={opensPoints[i].x}
              cy={opensPoints[i].y}
              r={4}
              fill="#FFFFFF"
              stroke="#00243C"
              strokeWidth={2}
            />
            <circle
              cx={clicksPoints[i].x}
              cy={clicksPoints[i].y}
              r={3}
              fill="#7FA3CD"
            />
            <text
              x={opensPoints[i].x}
              y={height + 16}
              fontSize="10"
              fill="#8A94A6"
              textAnchor="middle"
            >
              {d.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function NewsletterAnalytics({
  summary,
  engagementData,
  broadcasts,
  dateRange,
  onDateRangeChange,
  onExportReport,
}: NewsletterAnalyticsProps) {
  const [rangeOpen, setRangeOpen] = useState(false);
  const rangeOptions = [
    "Last 7 Days",
    "Last 30 Days",
    "Last 90 Days",
    "This Year",
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-semibold text-gwc-navy tracking-tight">
            Newsletter Analytics
          </h1>
          <p className="text-sm text-gwc-text-body">
            Overview of engagement metrics for {dateRange.toLowerCase()}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setRangeOpen((v) => !v)}
              className="flex items-center gap-2 bg-white border border-gwc-border rounded-lg px-4 py-2.5 text-sm text-gwc-text-body cursor-pointer hover:bg-gwc-muted-bg transition-colors"
            >
              <Calendar className="h-4 w-4" />
              {dateRange}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {rangeOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setRangeOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-white rounded-md shadow-lg border border-gwc-border/20 py-1">
                  {rangeOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        onDateRangeChange(option);
                        setRangeOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gwc-text-body hover:bg-gwc-muted-bg cursor-pointer"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button
            onClick={onExportReport}
            className="flex items-center gap-2 bg-gwc-navy text-white rounded-lg px-4 py-2.5 text-sm font-semibold cursor-pointer hover:brightness-110"
          >
            <Download className="h-4 w-4" />
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={<Send className="h-4 w-4" />}
          label="Total Sent"
          value={summary.totalSent.toLocaleString()}
          change={summary.totalSentChange}
          changeTone={summary.totalSentChange.startsWith("+") ? "up" : "down"}
        />
        <StatCard
          icon={<Mail className="h-4 w-4" />}
          label="Avg. Open Rate"
          value={`${summary.avgOpenRate}%`}
          change={summary.avgOpenRateChange}
          changeTone={summary.avgOpenRateChange.startsWith("+") ? "up" : "down"}
        />
        <StatCard
          icon={<MousePointerClick className="h-4 w-4" />}
          label="Avg. Click Rate"
          value={`${summary.avgClickRate}%`}
          change={summary.avgClickRateChange}
          changeTone={
            summary.avgClickRateChange.startsWith("+") ? "up" : "down"
          }
        />
        <StatCard
          icon={<UserMinus className="h-4 w-4" />}
          label="Unsubscribes"
          value={summary.unsubscribes.toString()}
          change={summary.unsubscribesChange}
          changeTone={
            summary.unsubscribesChange.startsWith("+") ? "down" : "up"
          }
        />
      </div>

      <div className="bg-white rounded-xl border border-gwc-border/20 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gwc-text-heading">
            Engagement Trends
          </h2>
          <div className="flex items-center gap-4 text-xs text-gwc-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-gwc-navy" /> Opens
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#7FA3CD]" /> Clicks
            </span>
          </div>
        </div>
        <EngagementChart data={engagementData} />
      </div>

      <div className="bg-white rounded-xl border border-gwc-border/20 shadow-sm">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gwc-border/20">
          <h2 className="text-base font-semibold text-gwc-text-heading">
            Recent Broadcasts
          </h2>
          <button className="text-sm font-semibold text-gwc-navy cursor-pointer hover:underline">
            View All →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gwc-text-muted border-b border-gwc-border/10">
                <th className="py-3 px-6 font-medium">Subject Line</th>
                <th className="py-3 px-6 font-medium">Date Sent</th>
                <th className="py-3 px-6 font-medium">Audience</th>
                <th className="py-3 px-6 font-medium">Open Rate</th>
                <th className="py-3 px-6 font-medium text-right">Clicks</th>
              </tr>
            </thead>
            <tbody>
              {broadcasts.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-10 px-6 text-center text-gwc-text-muted"
                  >
                    No newsletters sent in this period yet.
                  </td>
                </tr>
              )}
              {broadcasts.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-gwc-border/10 hover:bg-gwc-muted-bg/30"
                >
                  <td className="py-4 px-6 font-medium text-gwc-text-heading">
                    {b.subject}
                  </td>
                  <td className="py-4 px-6 text-gwc-text-muted">
                    {b.dateSent}
                  </td>
                  <td className="py-4 px-6">
                    <span className="bg-gwc-muted-bg text-gwc-text-body text-xs px-2.5 py-1 rounded-full">
                      {b.audience}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 w-32">
                      <div className="flex-1 h-1.5 rounded-full bg-gwc-border/20 overflow-hidden">
                        <div
                          className="h-full bg-gwc-navy rounded-full"
                          style={{ width: `${b.openRate}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gwc-text-heading">
                        {b.openRate}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right text-gwc-text-heading font-medium">
                    {b.clicks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
