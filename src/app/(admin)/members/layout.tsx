import { requirePermission } from "@/lib/session";

export default async function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("members.view");
  return <>{children}</>;
}
