"use client";

import { useState } from "react";
import { SideNavBar } from "@/components/layout/side-nav-bar";
import { TopAppBar } from "@/components/layout/top-app-bar";
import { BrandingProvider } from "@/lib/branding-context";

export type SessionUser = {
  name: string;
  email: string;
  role: string;
};

export function AdminShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <BrandingProvider>
      <div className="flex min-h-screen bg-gwc-surface">
        <div className="hidden md:block">
          <SideNavBar />
        </div>

        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileNavOpen(false)}
            />
            <div className="relative">
              <SideNavBar />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col md:ml-[280px]">
          <TopAppBar user={user} onMenuClick={() => setMobileNavOpen(true)} />
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </BrandingProvider>
  );
}
