import Link from "next/link";
import {
  LayoutDashboard,
  Send,
  Users,
  BarChart3,
  ShieldCheck,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Campaigns", href: "/campaigns", icon: Send },
  { label: "Members", href: "/members", icon: Users },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Privacy", href: "/privacy", icon: ShieldCheck },
];

export function SideNavBar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[280px] bg-gwc-navy px-6 py-16 flex flex-col justify-between">
      <div>
        <div className="text-white font-semibold text-lg mb-10">
          Glory Worship Church
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 text-white/80 hover:text-white hover:bg-white/10 rounded-md px-3 py-2 text-sm transition-colors"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
