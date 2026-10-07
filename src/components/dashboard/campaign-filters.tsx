"use client";

import { Search } from "lucide-react";
import type { CampaignStatus } from "@/lib/types/dashboard";

const BASE_CATEGORIES = [
  "General",
  "Events",
  "Ministry",
  "Onboarding",
  "Youth",
];

const STATUS_OPTIONS: {
  value: CampaignStatus | "all";
  label: string;
}[] = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "sending", label: "Sending" },
  { value: "sent", label: "Sent" },
  { value: "failed", label: "Failed" },
];

interface CampaignFiltersProps {
  status: CampaignStatus | "all";
  categories: string[];
  search: string;
  onStatusChange: (status: CampaignStatus | "all") => void;
  onCategoriesChange: (categories: string[]) => void;
  onSearchChange: (search: string) => void;
}

export function CampaignFilters({
  status,
  categories,
  search,
  onStatusChange,
  onCategoriesChange,
  onSearchChange,
}: CampaignFiltersProps) {
  const categoryOptions = Array.from(
    new Set([...BASE_CATEGORIES, ...categories])
  );

  function toggleCategory(category: string) {
    if (categories.includes(category)) {
      onCategoriesChange(categories.filter((item) => item !== category));
    } else {
      onCategoriesChange([...categories, category]);
    }
  }

  return (
    <div className="flex flex-col flex-wrap gap-3 sm:flex-row">
      <select
        value={status}
        onChange={(event) =>
          onStatusChange(event.target.value as CampaignStatus | "all")
        }
        aria-label="Filter by status"
        className="cursor-pointer rounded-md border border-gwc-border/30 bg-white px-3 py-2 text-sm"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <details className="relative">
        <summary className="cursor-pointer list-none rounded-md border border-gwc-border/30 bg-white px-3 py-2 text-sm">
          Category
          {categories.length > 0 && ` (${categories.length})`}
        </summary>

        <div className="absolute z-20 mt-1 w-56 rounded-md border border-gwc-border/20 bg-white p-2 shadow-lg">
          {categoryOptions.map((category) => (
            <label
              key={category}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gwc-muted-bg"
            >
              <input
                type="checkbox"
                checked={categories.includes(category)}
                onChange={() => toggleCategory(category)}
              />
              {category}
            </label>
          ))}

          {categories.length > 0 && (
            <button
              type="button"
              onClick={() => onCategoriesChange([])}
              className="mt-2 w-full rounded border-t border-gwc-border/20 px-2 py-2 text-left text-xs font-semibold text-gwc-navy hover:bg-gwc-muted-bg"
            >
              Clear categories
            </button>
          )}
        </div>
      </details>

      <div className="relative min-w-[200px] max-w-sm flex-1">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gwc-text-muted"
          aria-hidden="true"
        />

        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search campaigns..."
          aria-label="Search campaigns"
          className="w-full rounded-md border border-gwc-border/30 bg-white py-2 pl-9 pr-3 text-sm"
        />
      </div>
    </div>
  );
}
