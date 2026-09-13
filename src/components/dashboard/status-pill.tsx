import { cn } from "@/lib/utils";

type CampaignStatus = "draft" | "scheduled" | "sent";

const statusStyles: Record<CampaignStatus, string> = {
  draft: "bg-gwc-status-draft-bg text-gwc-text-body",
  sent: "bg-gwc-status-sent-bg text-green-800",
  scheduled: "bg-gwc-status-gold-bg text-gwc-gold-text",
};

const statusLabels: Record<CampaignStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  scheduled: "Scheduled",
};

export function StatusPill({ status }: { status: CampaignStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-sm font-gwc-heading font-medium",
        statusStyles[status]
      )}
    >
      {statusLabels[status]}
    </span>
  );
}