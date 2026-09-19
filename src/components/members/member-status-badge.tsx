import { cn } from "@/lib/utils";

export type MemberStatus = "active" | "inactive" | "pending";

const memberStatusConfig: Record<
  MemberStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  active: {
    label: "Active",
    bg: "bg-green-100",
    text: "text-green-700",
    dot: "bg-green-700",
  },
  inactive: {
    label: "Inactive",
    bg: "bg-gray-200",
    text: "text-gwc-text-body",
    dot: "bg-gray-500",
  },
  pending: {
    label: "Pending",
    bg: "bg-gwc-gold/30",
    text: "text-gwc-gold-text",
    dot: "bg-gwc-gold-text",
  },
};

export function MemberStatusBadge({ status }: { status: MemberStatus }) {
  const config = memberStatusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full",
        config.bg,
        config.text
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
