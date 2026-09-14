"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Plus,
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  HelpCircle,
} from "lucide-react";
import { GoldButton } from "@/components/ui/gold-button";
import { cn } from "cn";

const mainNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Members", href: "/members", icon: Users },
  { label: "Templates", href: "/templates", icon: FileText },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
];

const secondaryNavItems = [
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Support", href: "/support", icon: HelpCircle },
];

export function SideNavBar() {
  const pathname = usePathname();
  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-gwc-navy px-6 py-16 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-6 mb-10">
          <div className="h-12 w-12 rounded-full bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,0.05)] flex items-center justify-center shrink-0">
            <Image
              src="/church-logo.svg"
              alt="Glory Worship Church logo"
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-gwc-heading font-semibold text-lg leading-tight">
              Glory Worship Church
            </span>
            <span className="text-white/50 font-gwc-body text-xs leading-tight">
              Sanctuary CMS
            </span>
          </div>
        </div>

        <GoldButton
          label="Create Newsletter"
          icon={Plus}
          className="w-full mb-6"
        />

        <nav className="flex flex-col gap-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-white/15 text-white font-medium"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <nav className="flex flex-col gap-1 border-t border-white/20 pt-6">
        {secondaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-white/15 text-white font-medium"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
