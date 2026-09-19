import { cn } from "@/lib/utils";
import { CampaignStatus } from "@/lib/types/dashboard";

const statusConfig: Record<
  CampaignStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  draft: {
    label: "Draft",
    bg: "bg-gray-200",
    text: "text-gwc-text-body",
    dot: "bg-gray-500",
  },
  scheduled: {
    label: "Scheduled",
    bg: "bg-gwc-gold/30",
    text: "text-gwc-gold-text",
    dot: "bg-gwc-gold-text",
  },
  sent: {
    label: "Sent",
    bg: "bg-green-100",
    text: "text-green-700",
    dot: "bg-green-700",
  },
};

export function StatusBadge({ status }: { status: CampaignStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-gwc-heading px-3 py-1 rounded-full",
        config.bg,
        config.text
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
