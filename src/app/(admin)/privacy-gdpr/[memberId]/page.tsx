"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Download,
  FileArchive,
  ShieldAlert,
  ShieldCheck,
  Trash2,
} from "lucide-react";

type ConsentRow = {
  name: string;
  description: string;
  granted: boolean;
  dateGiven: string;
  expiryDate: string;
};

const consents: ConsentRow[] = [
  {
    name: "Email Communications",
    description:
      "Permission to send ministry updates, devotionals, and general notices.",
    granted: true,
    dateGiven: "Oct 12, 2024",
    expiryDate: "Lifetime",
  },
  {
    name: "Photo/Video Usage",
    description:
      "Granted inclusion of the member in congregation gallery and media promotions.",
    granted: true,
    dateGiven: "Oct 12, 2024",
    expiryDate: "Oct 12, 2025",
  },
  {
    name: "Data Sharing with Partners",
    description:
      "Permission to share demographic information with connected global ministries and church plants.",
    granted: false,
    dateGiven: "—",
    expiryDate: "—",
  },
  {
    name: "Newsletter Subscription",
    description:
      "Consent to send secondary CMS system newsletters and specialized community content.",
    granted: true,
    dateGiven: "Nov 01, 2024",
    expiryDate: "Lifetime",
  },
];

function Toggle({ checked }: { checked: boolean }) {
  return (
    <button
      type="button"
      aria-label={checked ? "Consent granted" : "Consent denied"}
      className={[
        "relative h-5 w-9 rounded-full transition",
        checked ? "bg-gwc-navy" : "bg-slate-200",
      ].join(" ")}
    >
      <span
        className={[
          "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition",
          checked ? "left-[18px]" : "left-0.5",
        ].join(" ")}
      />
    </button>
  );
}

export default function MemberPrivacyGdprPage({
  params,
}: {
  params: { memberId: string };
}) {
  const memberName =
    params.memberId === "martha-jenkins"
      ? "Martha Jenkins"
      : params.memberId
          .split("-")
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" ");

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-10">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs text-slate-400">
            Members Directory <span className="mx-1">›</span> {memberName}
            <span className="mx-1">›</span> Privacy &amp; GDPR
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gwc-navy">
            Privacy &amp; GDPR Settings
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage consent, data privacy rights, and GDPR compliance for this
            member.
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
        <div className="flex items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
              MJ
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-800">
                  {memberName}
                </h2>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Active Member
                </span>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                martha.j@example.com
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-slate-400">Member ID</p>
            <p className="mt-1 text-sm font-bold text-gwc-navy">#GW-1042</p>
          </div>
        </div>
      </section>

      <section className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-base font-semibold text-slate-800">
            Data Consent Management
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Review and toggle current authorizations given by the member.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Consent Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date Given</th>
                <th className="px-6 py-3 font-medium">Expiry Date</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {consents.map((consent) => (
                <tr key={consent.name}>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-800">
                      {consent.name}
                    </p>
                    <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                      {consent.description}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Toggle checked={consent.granted} />
                      <span
                        className={
                          consent.granted
                            ? "text-xs font-medium text-slate-700"
                            : "text-xs font-medium text-slate-400"
                        }
                      >
                        {consent.granted ? "Granted" : "Denied"}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-xs text-slate-600">
                    {consent.dateGiven}
                  </td>

                  <td className="px-6 py-4 text-xs text-slate-600">
                    {consent.expiryDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-base font-semibold text-slate-800">
              Data Access &amp; Export
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Generate reports and audit member activity records.
            </p>
          </div>

          <div className="p-4">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-4 text-left transition hover:bg-slate-50"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gwc-gold text-gwc-gold-text">
                  <Download className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    Export Member Data
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Download a structured ZIP file containing all personal data
                    under GDPR Article 15.
                  </span>
                </span>
              </span>

              <span className="text-lg text-slate-400">›</span>
            </button>

            <button
              type="button"
              className="mt-3 flex w-full items-center justify-between rounded-lg border border-slate-200 p-4 text-left transition hover:bg-slate-50"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gwc-navy text-white">
                  <FileArchive className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-slate-800">
                    View Data Processing Log
                  </span>
                  <span className="mt-1 block text-xs text-slate-500">
                    Examine historical compliance events, access timestamps, and
                    modifications.
                  </span>
                </span>
              </span>

              <span className="text-lg text-slate-400">›</span>
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-base font-semibold text-slate-800">
              Right to Erasure
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Safeguard compliance regarding personal information removal.
            </p>
          </div>

          <div className="p-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

                <div>
                  <h3 className="text-sm font-semibold text-red-800">
                    This action cannot be undone
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-red-700">
                    Requesting deletion permanently removes {memberName}’s
                    electronic records, contributions, and historical
                    congregation records.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-red-700 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-800"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Request Data Deletion
            </button>

            <p className="mt-3 text-xs text-slate-400">
              Initiates a 14-day hold before permanent wipe.
            </p>
          </div>
        </div>
      </section>

      <footer className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
        <ShieldCheck className="h-4 w-4" />
        Sanctuary CMS automatically securely archives consent logs in accordance
        with GDPR, HIPAA, and regional safety frameworks.
      </footer>
    </main>
  );
}
