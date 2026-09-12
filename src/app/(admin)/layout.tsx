import { SideNavBar } from "@/components/layout/side-nav-bar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gwc-surface">
      <SideNavBar />
      <main className="flex-1 ml-[280px] p-8">{children}</main>
    </div>
  );
}
