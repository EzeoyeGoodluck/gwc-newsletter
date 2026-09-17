"use client";

import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { Campaign, CampaignStatus } from "@/lib/types/dashboard";
import { cn } from "@/lib/utils";

const actionsByStatus: Record<CampaignStatus, string[]> = {
  draft: ["Edit", "Review", "Send Now", "Duplicate", "Archive", "Delete"],
  scheduled: ["Pause/Edit", "Reschedule", "Cancel", "Preview"],
  sent: ["View Report", "Duplicate", "Archive", "Delete"],
};

interface CampaignActionsProps {
  campaign: Campaign;
  onAction: (action: string, campaign: Campaign) => void;
}

export function CampaignActions({ campaign, onAction }: CampaignActionsProps) {
  const [open, setOpen] = useState(false);
  const actions = actionsByStatus[campaign.status];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Actions for ${campaign.title}`}
        className="p-2 rounded-md hover:bg-gwc-muted-bg cursor-pointer"
      >
        <MoreVertical
          className="h-4 w-4 text-gwc-text-muted"
          aria-hidden="true"
        />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white rounded-md shadow-lg border border-gwc-border/20 py-1">
            {actions.map((action) => (
              <button
                key={action}
                onClick={() => {
                  onAction(action, campaign);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm text-gwc-text-body hover:bg-gwc-muted-bg cursor-pointer",
                  (action === "Delete" || action === "Archive") &&
                    "text-red-600"
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
