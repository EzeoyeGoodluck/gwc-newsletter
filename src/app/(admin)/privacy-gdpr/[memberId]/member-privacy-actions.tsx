"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Loader2,
  MailCheck,
  MailX,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { eraseMember, setEmailConsent } from "../action";

const SOURCES = [
  "Verbal request",
  "Written request / letter",
  "Email request",
  "Signup form",
  "In-person at church",
  "Unsubscribe link",
];

export function MemberPrivacyActions({
  memberId,
  memberName,
  consented,
  erased,
  deliveryCount,
  groupCount,
}: {
  memberId: string;
  memberName: string;
  consented: boolean;
  erased: boolean;
  deliveryCount: number;
  groupCount: number;
}) {
  const router = useRouter();
  const [consentOpen, setConsentOpen] = useState(false);
  const [eraseOpen, setEraseOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleConsent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const res = await setEmailConsent(
      memberId,
      !consented,
      String(data.get("source") ?? "")
    );
    setBusy(false);
    if (!res.ok) return setError(res.message);
    setConsentOpen(false);
    setNotice(
      consented
        ? "Email consent withdrawn. This member won't receive newsletters."
        : "Email consent recorded."
    );
    router.refresh();
  }

  async function handleErase(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    const res = await eraseMember(
      memberId,
      String(data.get("confirmEmail") ?? ""),
      String(data.get("reason") ?? "")
    );
    setBusy(false);
    if (!res.ok) return setError(res.message);
    setEraseOpen(false);
    setNotice("Personal data erased.");
    router.refresh();
  }

  const field =
    "mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10";

  return (
    <>
      {notice && (
        <div
          role="status"
          className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {notice}
        </div>
      )}

      <section className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-base font-semibold text-slate-800">
              Consent &amp; data access
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Update email consent or provide a copy of this member&apos;s data.
            </p>
          </div>
          <div className="space-y-3 p-4">
            <button
              type="button"
              disabled={erased}
              onClick={() => {
                setConsentOpen(true);
                setError(null);
              }}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-4 text-left transition hover:bg-slate-50 disabled:opacity-40"
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-md ${consented ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}
              >
                {consented ? (
                  <MailX className="h-4 w-4" />
                ) : (
                  <MailCheck className="h-4 w-4" />
                )}
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  {consented
                    ? "Withdraw email consent"
                    : "Record email consent"}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {consented
                    ? "Stop all newsletters to this member."
                    : "Only if the member has agreed to receive email."}
                </span>
              </span>
            </button>

            <a
              href={`/api/privacy/export/${memberId}`}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-4 text-left transition hover:bg-slate-50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gwc-gold text-gwc-gold-text">
                <Download className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Export member data
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  Download a JSON file with personal details, groups, email
                  history, and privacy history.
                </span>
              </span>
            </a>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-base font-semibold text-slate-800">
              Right to erasure
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Remove this member&apos;s personal information on request.
            </p>
          </div>
          <div className="p-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <div>
                  <h3 className="text-sm font-semibold text-red-800">
                    This can&apos;t be undone
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-red-700">
                    Wipes the name, email, phone, address, notes, and{" "}
                    {groupCount} group{" "}
                    {groupCount === 1 ? "membership" : "memberships"}.{" "}
                    {deliveryCount} newsletter{" "}
                    {deliveryCount === 1 ? "record is" : "records are"} kept
                    anonymously for statistics.
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              disabled={erased}
              onClick={() => {
                setEraseOpen(true);
                setError(null);
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-red-700 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-red-800 disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {erased ? "Already erased" : "Erase personal data"}
            </button>
          </div>
        </div>
      </section>

      {consentOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleConsent}
            className="w-full max-w-md rounded-xl bg-white shadow-xl"
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-800">
                {consented ? "Withdraw email consent" : "Record email consent"}
              </h2>
              <button
                type="button"
                onClick={() => setConsentOpen(false)}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  How was this received?
                </span>
                <select
                  required
                  name="source"
                  defaultValue=""
                  className={field}
                >
                  <option value="" disabled>
                    Choose…
                  </option>
                  {SOURCES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConsentOpen(false)}
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-md bg-gwc-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {eraseOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={handleErase}
            className="w-full max-w-md rounded-xl bg-white shadow-xl"
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <h2 className="text-lg font-semibold text-red-800">
                Erase {memberName}&apos;s data
              </h2>
              <button
                type="button"
                onClick={() => setEraseOpen(false)}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
              <p className="text-sm leading-6 text-slate-600">
                Export their data first if they asked for a copy. Then type
                their email address to confirm.
              </p>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Member&apos;s email
                </span>
                <input
                  required
                  name="confirmEmail"
                  autoComplete="off"
                  className={field}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Reason
                </span>
                <input
                  required
                  name="reason"
                  placeholder="e.g. Member requested deletion by email on 1 Oct"
                  className={field}
                />
              </label>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEraseOpen(false)}
                  className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Erase permanently
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
