import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/layout/admin-shell"; // keep your existing path

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  const settings = await prisma.churchSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });

  return (
    <AdminShell
      user={{
        name: user.name ?? "",
        email: user.email ?? "",
        role: user.role ?? "VIEWER",
      }}
      branding={{
        name: settings.name,
        logoUrl: settings.logoUrl ?? undefined,
        primaryColor: settings.primaryColor,
        accentColor: settings.accentColor,
      }}
    >
      {children}
    </AdminShell>
  );
}
