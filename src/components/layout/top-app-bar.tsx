"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Search,
  Bell,
  HelpCircle,
  Send,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { GoldButton } from "@/components/ui/gold-button";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import { ROLE_LABELS, can } from "@/lib/permissions";
import type { SessionUser } from "@/components/layout/admin-shell";

interface TopAppBarProps {
  user: SessionUser;
  onMenuClick?: () => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function UserMenu({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await authClient.signOut();
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open account menu"
        className="flex items-center gap-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-gwc-navy/20 cursor-pointer"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gwc-navy text-sm font-semibold text-white">
          {getInitials(user.name) || "?"}
        </span>
        <ChevronDown
          className={cn(
            "hidden h-4 w-4 text-gwc-text-muted transition-transform sm:block",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-gwc-border/50 bg-white shadow-lg"
        >
          <div className="border-b border-gwc-border/30 px-4 py-3">
            <p className="truncate text-sm font-semibold text-gwc-text-heading">
              {user.name}
            </p>
            <p className="truncate text-xs text-gwc-text-muted">{user.email}</p>
            <span className="mt-2 inline-block rounded-full bg-gwc-muted-bg px-2.5 py-0.5 text-xs font-semibold text-gwc-navy">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm text-gwc-text-body transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}

export function TopAppBar({ user, onMenuClick }: TopAppBarProps) {
  const router = useRouter();

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

        {can(user.role, "newsletters.edit") && (
          <GoldButton
            label="Send Newsletter"
            icon={Send}
            onClick={() => router.push("/templates/create")}
          />
        )}

        <UserMenu user={user} />
      </div>
    </header>
  );
}
