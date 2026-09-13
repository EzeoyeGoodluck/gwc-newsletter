import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
interface KPICardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  watermarkIcon?: LucideIcon;
  badge?: string;
  variant?: "default" | "gold" | "navy-tint";
  onClick?: () => void;
}

export function KPICard({
  label,
  value,
  icon: Icon,
  watermarkIcon: WatermarkIcon,
  badge,
  variant = "default",
  onClick,
}: KPICardProps) {
  const isGold = variant === "gold";
  const isNavyTint = variant === "navy-tint";

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex-1 bg-white rounded-gwc-card border border-gwc-border/20 p-6 overflow-hidden",
        "shadow-[0_4px_20px_rgba(0,58,93,0.05)]",
        "text-left transition-transform hover:-translate-y-0.5",
        onClick ? "cursor-pointer" : "cursor-default"
      )}
    >
      {WatermarkIcon && (
        <WatermarkIcon className="absolute -bottom-2 -right-2 h-20 w-20 text-black opacity-5 pointer-events-none" />
      )}

      <div className="relative flex items-center justify-between mb-6">
        <div
          className={cn(
            "flex items-center justify-center h-11 w-11 rounded-lg",
            isGold
              ? "bg-gwc-gold/20"
              : isNavyTint
                ? "bg-gwc-navy/10"
                : "bg-gwc-muted-bg"
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5",
              isGold
                ? "text-gwc-gold-text"
                : isNavyTint
                  ? "text-gwc-navy-light"
                  : "text-gwc-text-body"
            )}
          />
        </div>
        {badge && (
          <span
            className={cn(
              "text-xs font-gwc-heading font-semibold px-3 py-1 rounded-full",
              isGold
                ? "bg-gwc-gold/20 text-gwc-gold-text"
                : isNavyTint
                  ? "bg-gwc-navy/10 text-gwc-navy-light"
                  : "bg-gwc-muted-bg text-gwc-text-body"
            )}
          >
            {badge}
          </span>
        )}
      </div>
      <p className="relative font-gwc-body text-base text-gwc-text-body mb-1">
        {label}
      </p>
      <p className="relative font-gwc-heading font-bold text-5xl tracking-tight text-gwc-text-heading">
        {value}
      </p>
    </button>
  );
}
