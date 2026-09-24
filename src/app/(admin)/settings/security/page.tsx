"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileText,
  KeyRound,
  Laptop,
  LockKeyhole,
  LogOut,
  MonitorSmartphone,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Trash2,
} from "lucide-react";

type Session = {
  id: number;
  device: string;
  location: string;
  lastActive: string;
  isCurrent?: boolean;
  icon: "desktop" | "mobile";
};

const initialSessions: Session[] = [
  {
    id: 1,
    device: "Chrome on macOS",
    location: "Springfield, Illinois, United States",
    lastActive: "Active now",
    isCurrent: true,
    icon: "desktop",
  },
  {
    id: 2,
    device: "Safari on iPhone",
    location: "Springfield, Illinois, United States",
    lastActive: "Today, 8:14 AM",
    icon: "mobile",
  },
  {
    id: 3,
    device: "Chrome on Windows",
    location: "Chicago, Illinois, United States",
    lastActive: "Sep 19, 2026, 4:32 PM",
    icon: "desktop",
  },
];

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-5 border-b border-slate-100 py-5 last:border-b-0">
      <div>
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={[
          "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition focus:outline-none focus:ring-2 focus:ring-gwc-navy focus:ring-offset-2",
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

export default function SecurityPrivacySettingsPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [newDeviceAlerts, setNewDeviceAlerts] = useState(true);
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [notice, setNotice] = useState<string | null>(null);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showEraseWarning, setShowEraseWarning] = useState(false);

  function revokeSession(id: number) {
    const target = sessions.find((session) => session.id === id);

    if (target?.isCurrent) {
      setNotice("Your current session cannot be revoked from this UI preview.");
      return;
    }

    setSessions((current) => current.filter((session) => session.id !== id));
    setNotice(
      `${target?.device ?? "The selected session"} was revoked in this UI preview.`
    );
  }

  function signOutOtherSessions() {
    const revokedCount = sessions.filter(
      (session) => !session.isCurrent
    ).length;
    setSessions((current) => current.filter((session) => session.isCurrent));
    setNotice(
      revokedCount > 0
        ? `${revokedCount} other ${revokedCount === 1 ? "session was" : "sessions were"} revoked in this UI preview.`
        : "There are no other active sessions to revoke."
    );
  }

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
            organization-level security settings.
          </p>
        </div>
      </header>

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
            className="rounded p-1 text-emerald-700 transition hover:bg-emerald-100"
            aria-label="Dismiss notification"
          >
            ×
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
                  Strengthen sign-in security for your administrator account.
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
                    Last changed 90 days ago.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasswordForm((current) => !current)}
                  className="inline-flex shrink-0 items-center justify-center rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Change password
                </button>
              </div>

              {showPasswordForm && (
                <div className="rounded-lg bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-800">
                    Password update preview
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    A real password update must be handled by your
                    authentication provider. This UI does not collect or store
                    password data.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(false)}
                    className="mt-4 rounded-md bg-gwc-navy px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Close preview
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-gwc-navy">
                    <Smartphone className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-800">
                        Two-factor authentication
                      </h3>
                      <span
                        className={[
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          twoFactorEnabled
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700",
                        ].join(" ")}
                      >
                        {twoFactorEnabled
                          ? "Enabled in preview"
                          : "Not enabled"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Add a second verification step when signing in to your CMS
                      account.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTwoFactorEnabled((current) => !current);
                    setNotice(
                      twoFactorEnabled
                        ? "Two-factor authentication was disabled in this UI preview."
                        : "Two-factor authentication was enabled in this UI preview."
                    );
                  }}
                  className="inline-flex shrink-0 items-center justify-center rounded-md bg-gwc-navy px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  {twoFactorEnabled ? "Disable in preview" : "Set up 2FA"}
                </button>
              </div>

              <ToggleRow
                title="New-device sign-in alerts"
                description="Receive an administrator notification when your account is accessed from a new device or browser."
                checked={newDeviceAlerts}
                onChange={(value) => {
                  setNewDeviceAlerts(value);
                  setNotice(
                    `New-device alerts were ${value ? "enabled" : "disabled"} in this UI preview.`
                  );
                }}
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
                    Review devices currently signed in to your account.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={signOutOtherSessions}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out other sessions
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {sessions.map((session) => {
                const SessionIcon =
                  session.icon === "desktop" ? Laptop : Smartphone;

                return (
                  <div
                    key={session.id}
                    className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-gwc-navy">
                        <SessionIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-800">
                            {session.device}
                          </h3>
                          {session.isCurrent && (
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                              Current session
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {session.location}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {session.lastActive}
                        </p>
                      </div>
                    </div>

                    {!session.isCurrent && (
                      <button
                        type="button"
                        onClick={() => revokeSession(session.id)}
                        className="inline-flex shrink-0 items-center justify-center rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Revoke access
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
                  Review organization-level activity and controls.
                </p>
              </div>
            </div>

            <div className="mt-5 divide-y divide-slate-100">
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
              <button
                type="button"
                onClick={() =>
                  setNotice(
                    "Audit log access is a UI-only link until audit data is connected."
                  )
                }
                className="flex w-full items-center justify-between gap-3 py-4 text-left text-sm font-semibold text-slate-700 transition hover:text-gwc-navy"
              >
                Audit activity log
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-slate-400"
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                onClick={() =>
                  setNotice(
                    "Data-retention controls are a UI-only link until organization storage policies are connected."
                  )
                }
                className="flex w-full items-center justify-between gap-3 py-4 text-left text-sm font-semibold text-slate-700 transition hover:text-gwc-navy"
              >
                Data retention policy
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-slate-400"
                  aria-hidden="true"
                />
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex gap-3">
              <CircleAlert
                className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
                aria-hidden="true"
              />
              <div>
                <h2 className="text-sm font-semibold text-amber-900">
                  Security controls need a backend
                </h2>
                <p className="mt-1 text-sm leading-6 text-amber-800">
                  Passwords, two-factor authentication, active sessions, alerts,
                  and privacy policies must be enforced by your authentication
                  and server-side authorization systems—not just this interface.
                </p>
              </div>
            </div>
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
              Account-level actions in this area require confirmation,
              authorization, and a secure backend implementation.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Request organization data erasure
            </h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Start a formal request to remove organization data. This should
              only be available to verified account owners and must follow the
              relevant retention and legal obligations.
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
          aria-labelledby="erase-dialog-title"
        >
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-start gap-3 border-b border-slate-100 px-6 py-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-700">
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2
                  id="erase-dialog-title"
                  className="text-lg font-semibold text-slate-800"
                >
                  Organization erasure request
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  This action is intentionally unavailable in the UI preview.
                </p>
              </div>
            </div>

            <div className="space-y-4 px-6 py-6">
              <p className="text-sm leading-6 text-slate-600">
                A real request requires verified owner authorization,
                retention-policy review, legal review where applicable, an
                auditable request record, and a secure backend workflow. It must
                never delete data directly from this interface.
              </p>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                Connect this action only after you have implemented a reviewed,
                server-side erasure-request process.
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowEraseWarning(false)}
                  className="rounded-md bg-gwc-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
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
