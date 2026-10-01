"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  FileText,
  Laptop,
  Loader2,
  LockKeyhole,
  LogOut,
  MonitorSmartphone,
  ShieldOff,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";
import {
  getSecurityOverview,
  revokeSession,
  revokeOtherSessions,
  changePassword,
  SecurityOverview,
} from "./actions";

function formatWhen(iso: string) {
  const d = new Date(iso);
  const mins = (Date.now() - d.getTime()) / 60_000;
  if (mins < 5) return "Active now";
  if (mins < 60) return `${Math.round(mins)} min ago`;
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  if (d.toDateString() === new Date().toDateString()) return `Today, ${time}`;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function daysAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function ComingSoonRow({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Smartphone;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
              Coming soon
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function SecurityPrivacySettingsPage() {
  const [data, setData] = useState<SecurityOverview | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showEraseWarning, setShowEraseWarning] = useState(false);

  const load = useCallback(async () => {
    const res = await getSecurityOverview();
    if (!res.ok) return setError(res.message);
    setData(res.data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function flash(ok: boolean, msg: string) {
    if (ok) {
      setNotice(msg);
      setError(null);
    } else {
      setError(msg);
      setNotice(null);
    }
  }

  async function handleRevoke(id: string, device: string) {
    setBusyId(id);
    const res = await revokeSession(id);
    setBusyId(null);
    flash(res.ok, res.ok ? `${device} was signed out.` : res.message);
    if (res.ok) load();
  }

  async function handleRevokeOthers() {
    const others = data?.sessions.filter((s) => !s.isCurrent).length ?? 0;
    if (others === 0) return flash(true, "There are no other active sessions.");
    if (
      !confirm(
        `Sign out ${others} other ${others === 1 ? "session" : "sessions"}?`
      )
    )
      return;

    setBusyId("others");
    const res = await revokeOtherSessions();
    setBusyId(null);
    if (!res.ok) return flash(false, res.message);
    flash(
      true,
      `${res.data} other ${res.data === 1 ? "session was" : "sessions were"} signed out.`
    );
    load();
  }

  async function handlePasswordChange(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setSavingPassword(true);
    setPasswordError(null);

    const res = await changePassword(new FormData(form));
    setSavingPassword(false);

    if (!res.ok) return setPasswordError(res.message);

    form.reset();
    setShowPasswordForm(false);
    flash(true, "Your password was changed.");
    load();
  }

  const otherCount = data?.sessions.filter((s) => !s.isCurrent).length ?? 0;
  const pwInput =
    "mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10";

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-10">
      <header className="mb-8">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-gwc-navy"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Settings
        </Link>
        <div className="mt-5">
          <p className="text-xs text-slate-400">Settings</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gwc-navy">
            Security &amp; Privacy
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Review account protection, active access, privacy controls, and
            organization-level security records.
          </p>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-6 flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <div className="flex items-start gap-3">
            <CircleAlert
              className="mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            />
            <p className="leading-6">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="rounded p-1 hover:bg-red-100"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {notice && (
        <div
          role="status"
          className="mb-6 flex items-start justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2
              className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
              aria-hidden="true"
            />
            <p className="leading-6">{notice}</p>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="rounded p-1 text-emerald-700 hover:bg-emerald-100"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-slate-100 px-6 py-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-gwc-navy">
                <LockKeyhole className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-800">
                  Account protection
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Strengthen sign-in security for your account.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 px-6">
              <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">
                    Password
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {!data
                      ? "Loading…"
                      : data.passwordChangedAt
                        ? `Last changed ${daysAgo(data.passwordChangedAt)}.`
                        : "No password set for this account."}
                  </p>
                </div>
                {data?.hasPassword && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm((v) => !v);
                      setPasswordError(null);
                    }}
                    className="inline-flex shrink-0 items-center justify-center rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {showPasswordForm ? "Cancel" : "Change password"}
                  </button>
                )}
              </div>

              {showPasswordForm && (
                <form
                  onSubmit={handlePasswordChange}
                  className="my-5 space-y-4 rounded-lg bg-slate-50 p-5"
                >
                  {passwordError && (
                    <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                      {passwordError}
                    </p>
                  )}

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">
                      Current password
                    </span>
                    <input
                      required
                      name="currentPassword"
                      type="password"
                      autoComplete="current-password"
                      className={pwInput}
                    />
                  </label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">
                        New password
                      </span>
                      <input
                        required
                        minLength={8}
                        name="newPassword"
                        type="password"
                        autoComplete="new-password"
                        className={pwInput}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">
                        Confirm new password
                      </span>
                      <input
                        required
                        minLength={8}
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        className={pwInput}
                      />
                    </label>
                  </div>
                  <label className="flex items-start gap-2.5">
                    <input
                      name="signOutOthers"
                      type="checkbox"
                      defaultChecked
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-gwc-navy"
                    />
                    <span className="text-sm text-slate-600">
                      Sign out my other devices
                    </span>
                  </label>
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="inline-flex items-center gap-2 rounded-md bg-gwc-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {savingPassword && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {savingPassword ? "Updating…" : "Update password"}
                  </button>
                </form>
              )}

              <ComingSoonRow
                icon={Smartphone}
                title="Two-factor authentication"
                description="Add a second verification step, such as an authenticator app code, when signing in."
              />
              <ComingSoonRow
                icon={MonitorSmartphone}
                title="New-device sign-in alerts"
                description="Get an email when your account is accessed from a new device or browser."
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-gwc-navy">
                  <MonitorSmartphone className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-base font-semibold text-slate-800">
                    Active sessions
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Devices currently signed in to your account.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRevokeOthers}
                disabled={busyId === "others" || otherCount === 0}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-40"
              >
                {busyId === "others" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                )}
                Sign out other sessions
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {!data && (
                <p className="px-6 py-5 text-sm text-slate-500">
                  Loading sessions…
                </p>
              )}
              {data?.sessions.map((s) => {
                const Icon = s.isMobile ? Smartphone : Laptop;
                return (
                  <div
                    key={s.id}
                    className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-gwc-navy">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-800">
                            {s.device}
                          </h3>
                          {s.isCurrent && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                              This device
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          IP address: {s.ipAddress || "Unknown"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {s.isCurrent
                            ? "Active now"
                            : `Last active ${formatWhen(s.lastActive)}`}{" "}
                          · Signed in {formatWhen(s.signedInAt)}
                        </p>
                      </div>
                    </div>
                    {!s.isCurrent && (
                      <button
                        type="button"
                        disabled={busyId === s.id}
                        onClick={() => handleRevoke(s.id, s.device)}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        {busyId === s.id && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        Sign out
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6 xl:h-fit">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-gwc-navy">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-800">
                  Security records
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Review organization activity and privacy controls.
                </p>
              </div>
            </div>

            <div className="mt-5 divide-y divide-slate-100">
              {data?.canViewAudit && (
                <Link
                  href="/settings/security/audit"
                  className="flex items-center justify-between gap-3 py-4 text-sm font-semibold text-slate-700 transition hover:text-gwc-navy"
                >
                  Audit activity log
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-slate-400"
                    aria-hidden="true"
                  />
                </Link>
              )}
              <Link
                href="/privacy-gdpr"
                className="flex items-center justify-between gap-3 py-4 text-sm font-semibold text-slate-700 transition hover:text-gwc-navy"
              >
                Privacy &amp; GDPR records
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-slate-400"
                  aria-hidden="true"
                />
              </Link>
              <div className="flex items-center justify-between gap-3 py-4 text-sm font-semibold text-slate-400">
                Data retention policy
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                  Coming soon
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-sm font-semibold text-slate-800">
              Security tips
            </h2>
            <ul className="mt-2 space-y-1.5 text-sm leading-6 text-slate-600">
              <li>Use a unique password you don&apos;t use anywhere else.</li>
              <li>Sign out devices you don&apos;t recognise.</li>
              <li>Remove team members who no longer serve in a role.</li>
            </ul>
          </section>
        </aside>
      </section>

      <section className="mt-6 overflow-hidden rounded-xl border border-red-200 bg-white shadow-sm">
        <div className="flex items-start gap-3 border-b border-red-100 bg-red-50 px-6 py-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700">
            <ShieldOff className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-red-900">
              Danger zone
            </h2>
            <p className="mt-1 text-sm text-red-800">
              Organization-level data actions need owner verification and
              review.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Request organization data erasure
            </h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Removing all church data is handled as a formal request, not a
              single click, so it can follow retention and legal obligations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowEraseWarning(true)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Request erasure
          </button>
        </div>
      </section>

      {showEraseWarning && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="erase-title"
        >
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-start gap-3 border-b border-slate-100 px-6 py-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700">
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2
                  id="erase-title"
                  className="text-lg font-semibold text-slate-800"
                >
                  Organization erasure request
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  This is not available as a self-service action.
                </p>
              </div>
            </div>
            <div className="space-y-4 px-6 py-6">
              <p className="text-sm leading-6 text-slate-600">
                To erase church data, the account Owner should contact the
                system administrator. Before anything is deleted, export any
                records you need to keep, such as giving or membership history.
              </p>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowEraseWarning(false)}
                  className="rounded-md bg-gwc-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                >
                  I understand
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
