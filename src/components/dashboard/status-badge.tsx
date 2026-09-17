import { cn } from "@/lib/utils";
import { CampaignStatus } from "@/lib/types/dashboard";

const statusConfig: Record<CampaignStatus, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-gray-100 text-gray-600" },
  scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-700" },
  sent: { label: "Sent", className: "bg-green-100 text-green-700" },
};

export function StatusBadge({ status }: { status: CampaignStatus }) {
  const config = statusConfig[status];
  return (
    <span className={cn("inline-flex items-center text-xs font-gwc-heading font-semibold px-3 py-1 rounded-full", config.className)}>
      {config.label}
    </span>
  );
}