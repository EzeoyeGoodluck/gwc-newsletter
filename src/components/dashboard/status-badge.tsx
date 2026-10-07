import { cn } from "@/lib/utils";
import type { CampaignStatus } from "@/lib/types/dashboard";

const statusConfig: Record<
  CampaignStatus,
  {
    label: string;
    className: string;
  }
> = {
  draft: {
    label: "Draft",
    className: "bg-gray-100 text-gray-600",
  },
  scheduled: {
    label: "Scheduled",
    className: "bg-blue-100 text-blue-700",
  },
  sending: {
    label: "Sending",
    className: "bg-amber-100 text-amber-700",
  },
  sent: {
    label: "Sent",
    className: "bg-green-100 text-green-700",
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-700",
  },
};

export function StatusBadge({ status }: { status: CampaignStatus }) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-gwc-heading font-semibold",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
