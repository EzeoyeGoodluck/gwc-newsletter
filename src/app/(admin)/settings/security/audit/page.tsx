import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { can } from "@/lib/permissions";

const PAGE_SIZE = 50;

const ACTION_LABELS: Record<string, string> = {
  "settings.branding.update": "Updated branding",
  "settings.organization.update": "Updated organization profile",
  "settings.communication.update": "Updated communication defaults",
  "team.role.change": "Changed a team member's role",
  "team.member.remove": "Removed a team member",
  "team.invite.create": "Sent an invitation",
  "team.invite.cancel": "Cancelled an invitation",
  "team.invite.accept": "Accepted an invitation",
  "integrations.email.create": "Added an email connection",
  "integrations.email.update": "Edited an email connection",
  "integrations.email.delete": "Deleted an email connection",
  "integrations.email.activate": "Activated an email connection",
  "integrations.email.test": "Sent a test email",
  "security.password.change": "Changed their password",
  "security.session.revoke": "Signed out a device",
  "security.session.revoke_others": "Signed out other devices",
};

const dateFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireUser();
  if (!can(user.role, "settings.manage")) redirect("/settings/security");

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { actor: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count(),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-10">
      <Link
        href="/settings/security"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-gwc-navy"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to Security &amp; Privacy
      </Link>
      <h1 className="mt-5 text-2xl font-bold tracking-tight text-gwc-navy">
        Audit activity log
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {total.toLocaleString()} recorded actions, newest first.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-6 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">Who</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-6 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-10 text-center text-slate-500"
                >
                  No activity recorded yet.
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="align-top text-slate-600">
                <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-500">
                  {dateFormat.format(log.createdAt)}
                </td>
                <td className="px-4 py-4">
                  <p className="font-medium text-slate-800">
                    {log.actor?.name ?? "Deleted user"}
                  </p>
                  <p className="text-xs text-slate-400">{log.actor?.email}</p>
                </td>
                <td className="px-4 py-4 font-medium text-slate-800">
                  {ACTION_LABELS[log.action] ?? log.action}
                </td>
                <td className="px-6 py-4">
                  {log.details ? (
                    <code className="block max-w-md whitespace-pre-wrap break-words rounded bg-slate-50 px-2 py-1 text-xs text-slate-600">
                      {JSON.stringify(log.details)}
                    </code>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-slate-500">
          <span>
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`?page=${page - 1}`}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Previous
              </Link>
            )}
            {page < pages && (
              <Link
                href={`?page=${page + 1}`}
                className="rounded-md border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
