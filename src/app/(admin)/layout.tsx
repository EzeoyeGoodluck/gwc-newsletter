import { SideNavBar } from "@/components/layout/side-nav-bar";
import { TopAppBar } from "@/components/layout/top-app-bar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gwc-surface">
      <SideNavBar />
      <div className="flex-1 flex flex-col ml-[280px]">
        <TopAppBar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
