"use client";

import Link from "next/link";
import {
  CheckCircle2,
  ChevronRight,
  Download,
  Eye,
  FileText,
  ShieldCheck,
  Trash2,
} from "lucide-react";

type ConsentRecord = {
  id: string;
  date: string;
  member: string;
  type: string;
  status: "Active" | "Withdrawn";
  ipAddress: string;
  method: string;
  href: string;
};

const consentRecords: ConsentRecord[] = [
  {
    id: "consent-1",
    date: "Apr 14, 2024",
    member: "Martha Jenkins",
    type: "Marketing & Newsletters",
    status: "Active",
    ipAddress: "192.168.1.105",
    method: "Web Portal Form",
    href: "/privacy-gdpr/martha-jenkins",
  },
  {
    id: "consent-2",
    date: "Jan 10, 2024",
    member: "James Anderson",
    type: "SMS Prayer Requests & Notifications",
    status: "Active",
    ipAddress: "192.168.1.105",
    method: "SMS Opt-In Request",
    href: "/privacy-gdpr/james-anderson",
  },
  {
    id: "consent-3",
    date: "Sep 15, 2023",
    member: "Sarah Williams",
    type: "Ministry Category Sharing",
    status: "Active",
    ipAddress: "10.0.0.42",
    method: "CMS Admin Portal",
    href: "/privacy-gdpr/sarah-williams",
  },
  {
    id: "consent-4",
    date: "Jun 02, 2023",
    member: "David Brown",
    type: "Third-Party Mission Analytics",
    status: "Withdrawn",
    ipAddress: "192.168.1.55",
    method: "Written Opt-Out Email",
    href: "/privacy-gdpr/david-brown",
  },
];

function StatusBadge({ status }: { status: ConsentRecord["status"] }) {
  const isActive = status === "Active";

  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold",
        isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
      ].join(" ")}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          isActive ? "bg-emerald-500" : "bg-red-500",
        ].join(" ")}
      />
      {status}
    </span>
  );
}

function ConsentToggle({
  title,
  description,
  checked = true,
}: {
  title: string;
  description: string;
  checked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 py-4 last:border-b-0">
      <div>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <p className="mt-1 max-w-[260px] text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        aria-label={`Toggle ${title}`}
        className={[
          "relative h-6 w-11 shrink-0 rounded-full transition",
          checked ? "bg-gwc-navy" : "bg-slate-200",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition",
            checked ? "left-6" : "left-1",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

export default function PrivacyGdprPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-10">
      <div className="mb-7">
        <p className="text-xs text-slate-400">
          Privacy &amp; Compliance <span className="mx-1">›</span> GDPR &amp;
          Privacy Management
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-gwc-navy">
          GDPR &amp; Privacy Management
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage compliance records, communications preferences, and data
          privacy rights for your congregation.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-slate-800">
            Consent &amp; Authorization Records
          </h2>

          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export Log
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Date Recorded</th>
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Consent Type / Scope</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">IP Address</th>
                <th className="px-4 py-3 font-medium">Consent Method</th>
                <th className="px-6 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {consentRecords.map((record) => (
                <tr key={record.id} className="text-xs text-slate-600">
                  <td className="px-6 py-4 whitespace-nowrap">{record.date}</td>
                  <td className="px-4 py-4 font-medium text-slate-700">
                    {record.member}
                  </td>
                  <td className="px-4 py-4 font-medium text-slate-700">
                    {record.type}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={record.status} />
                  </td>
                  <td className="px-4 py-4 text-slate-400">
                    {record.ipAddress}
                  </td>
                  <td className="px-4 py-4 text-slate-500">{record.method}</td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={record.href}
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
          <span>Showing 1–4 of 4 privacy consent records</span>

          <Link
            href="/privacy-gdpr/audit-log"
            className="inline-flex items-center gap-1 font-medium text-gwc-navy hover:text-gwc-gold"
          >
            Audit Trail Log Access
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3">
            <h2 className="text-base font-semibold text-slate-800">
              Subscription &amp; Communication Channels
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Toggle granular consent variables for outreach and service
              communications.
            </p>
          </div>

          <ConsentToggle
            title="Special Event Announcements"
            description="Includes church gatherings, weekly bulletins, and general community ministry updates."
          />
          <ConsentToggle
            title="SMS Text Notifications"
            description="Crisis alerts, urgent church updates, or pastoral broadcast SMS."
          />
          <ConsentToggle
            title="Personal Outreach & Follow-ups"
            description="Pastoral calls, greetings on special events, or volunteer schedules."
          />
          <ConsentToggle
            title="Anonymized Analytics Data Tracking"
            description="Improve newsletter targeting metrics based on anonymized interactions."
            checked={false}
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-base font-semibold text-slate-800">
              Individual Data Subject Rights
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Take specific, automated GDPR-compliant database actions.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 p-4">
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gwc-navy text-white">
                <Download className="h-4 w-4" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Request Official Data Portability Export
                </h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Download an encrypted zip containing a member’s contact
                  history, notes, metadata, and communication logs.
                </p>

                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-2 rounded-md bg-gwc-navy px-3 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Comprehensive Data Archive
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4">
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-red-100 text-red-700">
                <Trash2 className="h-4 w-4" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-red-800">
                  Right to Erasure (Forget Member)
                </h3>
                <p className="mt-1 text-xs leading-5 text-red-700">
                  Irreversibly deletes this member’s entire CMS directory file,
                  pastoral history, categories, and consent records.
                </p>

                <button
                  type="button"
                  className="mt-3 inline-flex items-center gap-2 rounded-md bg-red-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-800"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Permanently Delete Records &amp; Privacy Consent
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Privacy records are fully validated and compliant with GDPR.
        </span>

        <span>Consent updated today, 11:24 AM by admin_robert</span>
      </div>
    </main>
  );
}
