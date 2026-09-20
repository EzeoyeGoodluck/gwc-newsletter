"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft } from "lucide-react";

export interface CampaignDetails {
  campaignName: string;
  subjectLine: string;
  audience: string;
  category: string;
  sendOption: "now" | "schedule";
  scheduledDate: string;
}

interface CreateNewsletterStepTwoProps {
  templateName: string;
  initialData: CampaignDetails;
  availableAudiences: string[];
  availableCategories: string[];
  onBack: () => void;
  onContinue: (data: CampaignDetails) => void;
}

export function CreateNewsletterStepTwo({
  templateName,
  initialData,
  availableAudiences,
  availableCategories,
  onBack,
  onContinue,
}: CreateNewsletterStepTwoProps) {
  const [data, setData] = useState<CampaignDetails>(initialData);

  const update = <K extends keyof CampaignDetails>(
    key: K,
    value: CampaignDetails[K]
  ) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col gap-8 max-w-[720px]">
      <div className="flex flex-col gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-gwc-text-muted cursor-pointer hover:text-gwc-navy w-fit"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Templates
        </button>
        <h1 className="text-[28px] font-semibold text-gwc-navy tracking-tight">
          Campaign Details
        </h1>
        <p className="text-sm text-gwc-text-body">
          Starting from{" "}
          <span className="font-medium text-gwc-text-heading">
            {templateName}
          </span>
          . Step 2 of 3.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gwc-border/20 p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-gwc-text-body">
            Campaign Name <span className="text-red-600">*</span>
          </label>
          <input
            value={data.campaignName}
            onChange={(e) => update("campaignName", e.target.value)}
            placeholder="e.g., Weekly Bulletin - April 14th"
            className="border border-gwc-border/50 rounded-lg px-4 py-3 text-[15px] text-gwc-navy bg-gwc-muted-bg focus:outline-none focus:ring-2 focus:ring-gwc-navy/20"
          />
          <span className="text-xs text-gwc-text-muted">
            Internal name — not shown to recipients.
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-semibold text-gwc-text-body">
            Subject Line <span className="text-red-600">*</span>
          </label>
          <input
            value={data.subjectLine}
            onChange={(e) => update("subjectLine", e.target.value)}
            placeholder="e.g., This Week at Glory Worship Church"
            className="border border-gwc-border/50 rounded-lg px-4 py-3 text-[15px] text-gwc-navy bg-gwc-muted-bg focus:outline-none focus:ring-2 focus:ring-gwc-navy/20"
          />
        </div>

        <div className="flex gap-6">
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[13px] font-semibold text-gwc-text-body">
              Audience
            </label>
            <div className="relative">
              <select
                value={data.audience}
                onChange={(e) => update("audience", e.target.value)}
                className="w-full border border-gwc-border/50 rounded-lg px-4 py-3 text-[15px] text-gwc-navy bg-gwc-muted-bg focus:outline-none focus:ring-2 focus:ring-gwc-navy/20 appearance-none"
              >
                {availableAudiences.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gwc-text-muted pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[13px] font-semibold text-gwc-text-body">
              Category
            </label>
            <div className="relative">
              <select
                value={data.category}
                onChange={(e) => update("category", e.target.value)}
                className="w-full border border-gwc-border/50 rounded-lg px-4 py-3 text-[15px] text-gwc-navy bg-gwc-muted-bg focus:outline-none focus:ring-2 focus:ring-gwc-navy/20 appearance-none"
              >
                {availableCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gwc-text-muted pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-gwc-border/20 pt-6">
          <label className="text-[13px] font-semibold text-gwc-text-body">
            Send Timing
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gwc-text-body cursor-pointer">
              <input
                type="radio"
                checked={data.sendOption === "now"}
                onChange={() => update("sendOption", "now")}
                className="cursor-pointer"
              />
              Send immediately after review
            </label>
            <label className="flex items-center gap-2 text-sm text-gwc-text-body cursor-pointer">
              <input
                type="radio"
                checked={data.sendOption === "schedule"}
                onChange={() => update("sendOption", "schedule")}
                className="cursor-pointer"
              />
              Schedule for later
            </label>
          </div>
          {data.sendOption === "schedule" && (
            <input
              type="datetime-local"
              value={data.scheduledDate}
              onChange={(e) => update("scheduledDate", e.target.value)}
              className="border border-gwc-border/50 rounded-lg px-4 py-3 text-[15px] text-gwc-navy bg-gwc-muted-bg focus:outline-none focus:ring-2 focus:ring-gwc-navy/20 w-fit"
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-lg text-sm font-semibold text-gwc-text-body border border-gwc-border/50 cursor-pointer hover:bg-gwc-muted-bg"
        >
          Cancel
        </button>
        <button
          onClick={() => onContinue(data)}
          disabled={!data.campaignName.trim() || !data.subjectLine.trim()}
          className="px-6 py-3 rounded-lg text-sm font-semibold bg-gwc-navy text-white cursor-pointer hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Editor
        </button>
      </div>
    </div>
  );
}
