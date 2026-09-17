"use client";

import { Search } from "lucide-react";
import { CampaignStatus } from "@/lib/types/dashboard";

const CATEGORIES = [
  "Weekly Update",
  "Event",
  "Prayer Request",
  "Announcement",
  "Sermon Recap",
];
const STATUS_OPTIONS: { value: CampaignStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "sent", label: "Sent" },
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
  function toggleCategory(cat: string) {
    if (categories.includes(cat)) {
      onCategoriesChange(categories.filter((c) => c !== cat));
    } else {
      onCategoriesChange([...categories, cat]);
    }
  }

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-3 mb-4">
      <select
        value={status}
        onChange={(e) =>
          onStatusChange(e.target.value as CampaignStatus | "all")
        }
        aria-label="Filter by status"
        className="border border-gwc-border/30 rounded-md px-3 py-2 text-sm bg-white cursor-pointer"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <div className="relative">
        <details className="relative">
          <summary className="border border-gwc-border/30 rounded-md px-3 py-2 text-sm bg-white cursor-pointer list-none">
            Category {categories.length > 0 && `(${categories.length})`}
          </summary>
          <div className="absolute z-20 mt-1 w-56 bg-white rounded-md shadow-lg border border-gwc-border/20 p-2">
            {CATEGORIES.map((cat) => (
              <label
                key={cat}
                className="flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer hover:bg-gwc-muted-bg rounded"
              >
                <input
                  type="checkbox"
                  checked={categories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                />
                {cat}
              </label>
            ))}
          </div>
        </details>
      </div>

      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gwc-text-muted"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search campaigns..."
          aria-label="Search campaigns"
          className="w-full border border-gwc-border/30 rounded-md pl-9 pr-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}
