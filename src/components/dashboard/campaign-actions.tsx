"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import type { Campaign, CampaignStatus } from "@/lib/types/dashboard";

import { cn } from "@/lib/utils";

const actionsByStatus: Record<CampaignStatus, string[]> = {
  draft: ["Edit", "Review", "Send Now", "Duplicate", "Archive", "Delete"],
  scheduled: ["Pause/Edit", "Reschedule", "Cancel", "Preview"],
  sending: ["View Progress", "Preview"],
  sent: ["View Report", "Duplicate", "Archive", "Delete"],
  failed: ["View Report", "Edit", "Duplicate", "Delete"],
};

interface CampaignActionsProps {
  campaign: Campaign;
  onAction: (action: string, campaign: Campaign) => void;
}

export function CampaignActions({ campaign, onAction }: CampaignActionsProps) {
  const [open, setOpen] = useState(false);

  const actions = actionsByStatus[campaign.status];

  return (
    <div className="relative flex justify-end">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        aria-label={`Actions for ${campaign.title}`}
        className="flex cursor-pointer items-center gap-1 rounded-lg bg-gwc-navy px-6 py-3 text-sm font-gwc-heading font-semibold text-white hover:brightness-110"
      >
        Select
        <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-md border border-gwc-border/20 bg-white py-1 shadow-lg">
            {actions.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => {
                  setOpen(false);
                  onAction(action, campaign);
                }}
                className={cn(
                  "w-full cursor-pointer px-3 py-2 text-left text-sm hover:bg-gwc-muted-bg",
                  action === "Delete"
                    ? "text-red-600 hover:bg-red-50"
                    : "text-gwc-text-body"
                )}
              >
                {action}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
