import { Inbox, RefreshCcw } from "lucide-react";
import { GoldButton } from "@/components/ui/gold-button";

export function NoCampaignsEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <Inbox className="h-10 w-10 text-gwc-text-muted" aria-hidden="true" />
      <p className="text-gwc-text-body font-gwc-heading font-semibold">
        No campaigns yet
      </p>
      <p className="text-gwc-text-muted text-sm max-w-sm">
        You haven&apos;t created any newsletters yet. Get started with your
        first campaign.
      </p>
      <GoldButton label="Create Your First Newsletter" onClick={onCreate} />
    </div>
  );
}

export function NoMatchesEmptyState({
  onClearFilters,
}: {
  onClearFilters: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <Inbox className="h-10 w-10 text-gwc-text-muted" aria-hidden="true" />
      <p className="text-gwc-text-body font-gwc-heading font-semibold">
        No matching campaigns
      </p>
      <p className="text-gwc-text-muted text-sm max-w-sm">
        Try adjusting your filters or search term.
      </p>
      <button
        onClick={onClearFilters}
        className="text-sm font-gwc-heading font-semibold text-gwc-navy underline cursor-pointer"
      >
        Clear Filters
      </button>
    </div>
  );
}

export function CampaignsErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <p className="text-gwc-text-body font-gwc-heading font-semibold">
        Couldn&apos;t load campaigns
      </p>
      <p className="text-gwc-text-muted text-sm max-w-sm">
        Something went wrong fetching your campaigns. Check your connection and
        try again.
      </p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 bg-gwc-gold text-gwc-gold-text font-gwc-heading font-semibold rounded-gwc-input px-4 py-2 text-sm cursor-pointer hover:brightness-95"
      >
        <RefreshCcw className="h-4 w-4" aria-hidden="true" />
        Retry
      </button>
    </div>
  );
}
