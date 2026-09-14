import { Menu, Search, Bell, HelpCircle, Send } from "lucide-react";
import { GoldButton } from "@/components/ui/gold-button";
import { cn } from "@/lib/utils";

interface TopAppBarProps {
  onMenuClick?: () => void;
}

export function TopAppBar({ onMenuClick }: TopAppBarProps) {
  return (
    <header className="flex items-center justify-between gap-6 px-4 md:px-8 py-4 bg-gwc-surface/80 backdrop-blur-md border-b border-gwc-border/30">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 -ml-2 text-gwc-text-muted hover:text-gwc-text"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gwc-text-muted" />
        <input
          type="text"
          aria-label="Search"
          placeholder="Search newsletters..."
          className={cn(
            "w-full bg-gwc-muted-bg border border-gwc-border/50 rounded-lg",
            "pl-10 pr-6 py-3.5 text-sm text-gwc-text-body placeholder:text-gwc-text-muted",
            "focus:outline-none focus:ring-2 focus:ring-gwc-navy/20"
          )}
        />
      </div>

      <div className="flex items-center gap-6">
        <button
          aria-label="Notifications"
          className="text-gwc-text-body hover:text-gwc-text-heading transition-colors"
        >
          <Bell className="h-5 w-5" />
        </button>
        <button
          aria-label="Help"
          className="text-gwc-text-body hover:text-gwc-text-heading transition-colors"
        >
          <HelpCircle className="h-5 w-5" aria-hidden="true" />
        </button>

        <GoldButton label="Send Newsletter" icon={Send} />

        <div className="h-10 w-10 rounded-full bg-gwc-navy-light overflow-hidden shrink-0" />
      </div>
    </header>
  );
}
