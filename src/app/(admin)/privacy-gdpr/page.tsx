import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Download, Info, Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { can } from "@/lib/permissions";

const PAGE_SIZE = 25;
const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

const STATUS_STYLES: Record<string, string> = {
  SUBSCRIBED: "bg-emerald-50 text-emerald-700",
  UNSUBSCRIBED: "bg-red-50 text-red-700",
  BOUNCED: "bg-amber-50 text-amber-700",
};
const STATUS_LABELS: Record<string, string> = {
  SUBSCRIBED: "Consented",
  UNSUBSCRIBED: "Withdrawn",
  BOUNCED: "Bounced",
};

export default async function PrivacyGdprPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}) {
  const user = await requireUser();
  if (!can(user.role, "members.view")) redirect("/dashboard");
  const canManage = can(user.role, "members.manage");

  const { q = "", page: pageParam, status = "" } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const search = q.trim();

  const where = {
    ...(search ? { OR: [{ name: { contains: search } }, { email: { contains: search } }] } : {}),
    ...(status === "NO_CONSENT"
      ? { consentAt: null, status: "SUBSCRIBED" as const }
      : ["SUBSCRIBED", "UNSUBSCRIBED", "BOUNCED"].includes(status)
        ? { status: status as "SUBSCRIBED" | "UNSUBSCRIBED" | "BOUNCED" }
        : {}),
  };

  const [members, total, subscribed, unsubscribed, bounced, noConsent, lastEvent] = await Promise.all([
    prisma.member.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        memberNumber: true,
        name: true,
        email: true,
        status: true,
        consentAt: true,
        consentSource: true,
        unsubscribedAt: true,
      },
    }),
    prisma.member.count({ where }),
    prisma.member.count({ where: { status: "SUBSCRIBED" } }),
    prisma.member.count({ where: { status: "UNSUBSCRIBED" } }),
    prisma.member.count({ where: { status: "BOUNCED" } }),
    prisma.member.count({ where: { status: "SUBSCRIBED", consentAt: null } }),
    prisma.privacyEvent.findFirst({
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { name: true } } },
    }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const link = (next: Record<string, string | number>) => {
    const params = new URLSearchParams({ ...(search && { q: search }), ...(status && { status }), page: "1" });
    Object.entries(next).forEach(([k, v]) => (v === "" ? params.delete(k) : params.set(k, String(v))));
    return `?${params.toString()}`;
  };

  const stats = [
    { label: "Consented", value: subscribed, filter: "SUBSCRIBED", tone: "text-emerald-700" },
    { label: "Withdrawn", value: unsubscribed, filter: "UNSUBSCRIBED", tone: "text-red-700" },
    { label: "Bounced", value: bounced, filter: "BOUNCED", tone: "text-amber-700" },
    { label: "Subscribed, no consent date", value: noConsent, filter: "NO_CONSENT", tone: "text-slate-700" },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-10">
      <div className="mb-7">
        <p className="text-xs text-slate-400">
          Privacy &amp; Compliance <span className="mx-1">›</span> GDPR &amp; Privacy Management
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-gwc-navy">GDPR &amp; Privacy Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review email consent, handle data requests, and keep a record of privacy changes for your congregation.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.filter}
            href={link({ status: status === s.filter ? "" : s.filter })}
            className={`rounded-xl border bg-white p-5 shadow-sm transition hover:border-gwc-navy/40 ${
              status === s.filter ? "border-gwc-navy ring-1 ring-gwc-navy/20" : "border-slate-200"
            }`}
          >
            <p className="text-xs font-medium text-slate-500">{s.label}</p>
            <p className={`mt-2 text-2xl font-bold ${s.tone}`}>{s.value.toLocaleString()}</p>
          </Link>
        ))}
      </section>

      {noConsent > 0 && (
        <div className="mt-4 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            {noConsent} subscribed {noConsent === 1 ? "member has" : "members have"} no recorded consent date. Confirm how they
            agreed to receive email, then record it on their privacy page.
          </p>
        </div>
      )}

      <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-base font-semibold text-slate-800">Email consent records</h2>

          <div className="flex flex-col gap-3 sm:flex-row">
            <form className="relative">
              {status && <input type="hidden" name="status" value={status} />}
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={search}
                placeholder="Search name or email"
                className="w-full rounded-md border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10 sm:w-64"
              />
            </form>
            {canManage && (
              <a
                href="/api/privacy/log"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              >
                <Download className="h-3.5 w-3.5" />
                Export log (CSV)
              </a>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Email status</th>
                <th className="px-4 py-3 font-medium">Consent date</th>
                <th className="px-4 py-3 font-medium">Consent source</th>
                <th className="px-4 py-3 font-medium">Withdrawn</th>
                <th className="px-6 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                    No members match this search.
                  </td>
                </tr>
              )}
              {members.map((m) => (
                <tr key={m.id} className="text-xs text-slate-600">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-800">{m.name}</p>
                    <p className="mt-0.5 text-slate-400">
                      #{m.memberNumber} · {m.email}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${STATUS_STYLES[m.status]}`}>
                      {STATUS_LABELS[m.status]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {m.consentAt ? dateFormat.format(m.consentAt) : <span className="text-amber-600">Not recorded</span>}
                  </td>
                  <td className="px-4 py-4 text-slate-500">{m.consentSource || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-slate-500">
                    {m.unsubscribedAt ? dateFormat.format(m.unsubscribedAt) : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/privacy-gdpr/${m.id}`}
                      className="inline-flex items-center gap-1 font-semibold text-gwc-navy transition hover:text-gwc-gold"
                    >
                      Manage
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing {from}–{to} of {total.toLocaleString()} members
          </span>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link href={link({ page: page - 1 })} className="rounded-md border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50">
                Previous
              </Link>
            )}
            {page < pages && (
              <Link href={link({ page: page + 1 })} className="rounded-md border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50">
                Next
              </Link>
            )}
            {canManage && (
              <Link href="/settings/security/audit" className="ml-2 inline-flex items-center gap-1 font-medium text-gwc-navy hover:text-gwc-gold">
                Audit log
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800">Handling a data request</h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-500">
          <li>
            <strong className="text-slate-700">Access or copy:</strong> open the member and choose <em>Export member data</em>.
          </li>
          <li>
            <strong className="text-slate-700">Stop emails:</strong> open the member and withdraw email consent, recording how they asked.
          </li>
          <li>
            <strong className="text-slate-700">Erasure:</strong> open the member and use <em>Erase personal data</em>. Their details are wiped
            while anonymous sending statistics are kept.
          </li>
        </ul>
      </section>

      <p className="mt-6 text-center text-xs text-slate-400">
        {lastEvent
          ? `Last privacy change: ${new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(
              lastEvent.createdAt
            )} by ${lastEvent.actor?.name ?? "a former team member"}.`
          : "No privacy changes recorded yet."}
      </p>
    </main>
  );
}