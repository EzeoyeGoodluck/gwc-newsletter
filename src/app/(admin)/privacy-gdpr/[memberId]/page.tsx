import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { can } from "@/lib/permissions";
import { MemberPrivacyActions } from "./member-privacy-actions";

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
const dateTimeFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

const EVENT_LABELS: Record<string, string> = {
  "consent.granted": "Email consent granted",
  "consent.withdrawn": "Email consent withdrawn",
  "data.exported": "Personal data exported",
  "member.erased": "Personal data erased",
};

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("") || "M"
  );
}

export default async function MemberPrivacyGdprPage({
  params,
}: {
  params: Promise<{ memberId: string }>;
}) {
  const user = await requireUser();
  if (!can(user.role, "members.view")) redirect("/dashboard");
  const canManage = can(user.role, "members.manage");

  const { memberId } = await params;

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      privacyEvents: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { actor: { select: { name: true } } },
      },
      _count: { select: { deliveries: true, groups: true } },
    },
  });
  if (!member) notFound();

  const erased = member.email.endsWith("@erased.invalid");
  const consented = member.status === "SUBSCRIBED";

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-10">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs text-slate-400">
            Privacy &amp; GDPR <span className="mx-1">›</span> {member.name}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gwc-navy">
            Privacy &amp; GDPR Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage email consent and data requests for this member.
          </p>
        </div>
        <Link
          href="/privacy-gdpr"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Privacy
        </Link>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
              {initials(member.name)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-bold text-slate-800">
                  {member.name}
                </h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    erased
                      ? "bg-slate-100 text-slate-500"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {erased ? "Data erased" : `${member.membershipStatus} member`}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {erased ? "—" : member.email}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400">Member number</p>
            <p className="mt-1 text-sm font-bold text-gwc-navy">
              #{member.memberNumber}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-base font-semibold text-slate-800">
            Email consent
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Whether this member has agreed to receive newsletters and ministry
            email.
          </p>
        </div>
        <div className="grid gap-5 p-6 sm:grid-cols-4">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              Status
            </p>
            <p
              className={`mt-1 text-sm font-semibold ${consented ? "text-emerald-700" : "text-red-700"}`}
            >
              {consented
                ? "Consented"
                : member.status === "BOUNCED"
                  ? "Bounced"
                  : "Withdrawn"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              Consent given
            </p>
            <p className="mt-1 text-sm text-slate-700">
              {member.consentAt
                ? dateFormat.format(member.consentAt)
                : "Not recorded"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              Source
            </p>
            <p className="mt-1 text-sm text-slate-700">
              {member.consentSource || "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              Withdrawn
            </p>
            <p className="mt-1 text-sm text-slate-700">
              {member.unsubscribedAt
                ? dateFormat.format(member.unsubscribedAt)
                : "—"}
            </p>
          </div>
        </div>
      </section>

      {canManage ? (
        <MemberPrivacyActions
          memberId={member.id}
          memberName={member.name}
          consented={consented}
          erased={erased}
          deliveryCount={member._count.deliveries}
          groupCount={member._count.groups}
        />
      ) : (
        <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          Only owners and administrators can change consent, export data, or
          erase a member.
        </p>
      )}

      <section className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-base font-semibold text-slate-800">
            Privacy history
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Every consent change, export, and erasure for this member.
          </p>
        </div>
        {member.privacyEvents.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-500">
            No privacy changes recorded yet.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {member.privacyEvents.map((e) => {
              const details = (e.details ?? {}) as {
                source?: string;
                reason?: string;
              };
              return (
                <li
                  key={e.id}
                  className="flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {EVENT_LABELS[e.action] ?? e.action}
                    </p>
                    {(details.source || details.reason) && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {details.source ?? details.reason}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    {dateTimeFormat.format(e.createdAt)} ·{" "}
                    {e.actor?.name ?? "Unknown"}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <footer className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
        <ShieldCheck className="h-4 w-4" />
        Keep consent records accurate and retain only the data your church needs
        for legitimate operational and legal purposes.
      </footer>
    </main>
  );
}
