"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Clock3,
  Mail,
  Save,
  Send,
  ShieldCheck,
} from "lucide-react";

type CommunicationForm = {
  senderName: string;
  senderEmail: string;
  replyToEmail: string;
  sendingTimeZone: string;
  unsubscribeText: string;
  sendSuccessAlerts: boolean;
  sendFailureAlerts: boolean;
  notificationRecipients: string;
  sendTestCopy: boolean;
};

const timeZones = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Africa/Lagos",
  "Africa/Johannesburg",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Australia/Sydney",
];

const initialForm: CommunicationForm = {
  senderName: "Glory Worship Church",
  senderEmail: "newsletter@gloryworshipchurch.org",
  replyToEmail: "hello@gloryworshipchurch.org",
  sendingTimeZone: "America/Chicago",
  unsubscribeText:
    "You are receiving this email because you are connected with Glory Worship Church. You may update your communication preferences or unsubscribe at any time.",
  sendSuccessAlerts: true,
  sendFailureAlerts: true,
  notificationRecipients: "admin@gloryworshipchurch.org",
  sendTestCopy: true,
};

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
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

export default function CommunicationDefaultsPage() {
  const [form, setForm] = useState<CommunicationForm>(initialForm);
  const [isSaved, setIsSaved] = useState(false);

  function updateField<K extends keyof CommunicationForm>(
    field: K,
    value: CommunicationForm[K]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setIsSaved(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Replace with a server action or API request when persistence is ready.
    setIsSaved(true);
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-8 lg:px-10">
      <header className="mb-8">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-gwc-navy"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Settings
        </Link>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs text-slate-400">Settings</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gwc-navy">
              Communication Defaults
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Set the default sender identity, delivery preferences, and
              administrator notifications for newsletters.
            </p>
          </div>

          <button
            type="submit"
            form="communication-defaults-form"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-gwc-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-gwc-navy focus:ring-offset-2"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            Save Changes
          </button>
        </div>
      </header>

      {isSaved && (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
            aria-hidden="true"
          />
          <div>
            <p className="font-semibold">
              Communication defaults are ready to save
            </p>
            <p className="mt-0.5 text-emerald-700">
              Connect this form to your settings API or server action to persist
              these organization defaults.
            </p>
          </div>
        </div>
      )}

      <form
        id="communication-defaults-form"
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-slate-100 px-6 py-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-gwc-navy">
              <Mail className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Sender identity
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                These values prefill every new newsletter. Editors can review
                them before sending.
              </p>
            </div>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">
                Default sender name
              </span>
              <input
                required
                value={form.senderName}
                onChange={(event) =>
                  updateField("senderName", event.target.value)
                }
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
              />
              <span className="mt-2 block text-xs text-slate-400">
                Shown in a recipient’s inbox as the sender of your newsletter.
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Default sender email
              </span>
              <input
                required
                type="email"
                value={form.senderEmail}
                onChange={(event) =>
                  updateField("senderEmail", event.target.value)
                }
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
              />
              <span className="mt-2 block text-xs text-slate-400">
                This address should be verified with your email delivery
                provider.
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Default reply-to email
              </span>
              <input
                required
                type="email"
                value={form.replyToEmail}
                onChange={(event) =>
                  updateField("replyToEmail", event.target.value)
                }
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
              />
              <span className="mt-2 block text-xs text-slate-400">
                Replies from recipients are delivered to this address.
              </span>
            </label>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-slate-100 px-6 py-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-gwc-navy">
              <Clock3 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Delivery preferences
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Set the defaults used when scheduling and reviewing a newsletter
                delivery.
              </p>
            </div>
          </div>

          <div className="space-y-5 p-6">
            <label className="block max-w-md">
              <span className="text-sm font-semibold text-slate-700">
                Default sending time zone
              </span>
              <select
                value={form.sendingTimeZone}
                onChange={(event) =>
                  updateField("sendingTimeZone", event.target.value)
                }
                className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
              >
                {timeZones.map((timeZone) => (
                  <option key={timeZone} value={timeZone}>
                    {timeZone}
                  </option>
                ))}
              </select>
              <span className="mt-2 block text-xs text-slate-400">
                Scheduled campaign times are interpreted in this time zone
                unless changed during campaign creation.
              </span>
            </label>

            <div className="border-t border-slate-100 pt-1">
              <ToggleRow
                title="Send a test copy before delivery"
                description="Enable a test-send option by default when an editor reaches the newsletter review step."
                checked={form.sendTestCopy}
                onChange={(value) => updateField("sendTestCopy", value)}
              />
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-slate-100 px-6 py-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-gwc-navy">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Subscription footer
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Provide a clear explanation of why the recipient is receiving
                the email and how they can manage preferences.
              </p>
            </div>
          </div>

          <div className="p-6">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Default unsubscribe and preference text
              </span>
              <textarea
                required
                rows={4}
                value={form.unsubscribeText}
                onChange={(event) =>
                  updateField("unsubscribeText", event.target.value)
                }
                className="mt-2 w-full resize-y rounded-md border border-slate-200 px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none transition focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
              />
              <span className="mt-2 block text-xs leading-5 text-slate-400">
                Your delivery provider should still append working unsubscribe
                and preference-management links to every applicable email.
              </span>
            </label>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-slate-100 px-6 py-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-gwc-navy">
              <Bell className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Administrator delivery alerts
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Choose which campaign events should notify your church
                administrators.
              </p>
            </div>
          </div>

          <div className="p-6">
            <label className="block max-w-2xl">
              <span className="text-sm font-semibold text-slate-700">
                Alert recipients
              </span>
              <input
                type="email"
                value={form.notificationRecipients}
                onChange={(event) =>
                  updateField("notificationRecipients", event.target.value)
                }
                placeholder="admin@example.org"
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
              />
              <span className="mt-2 block text-xs text-slate-400">
                Use a shared administrator inbox. Support for multiple
                recipients can be added when the notification backend is
                connected.
              </span>
            </label>

            <div className="mt-5 border-t border-slate-100">
              <ToggleRow
                title="Campaign delivery success alerts"
                description="Notify administrators when a newsletter has finished sending successfully."
                checked={form.sendSuccessAlerts}
                onChange={(value) => updateField("sendSuccessAlerts", value)}
              />
              <ToggleRow
                title="Campaign delivery failure alerts"
                description="Notify administrators if a campaign cannot be delivered or requires attention."
                checked={form.sendFailureAlerts}
                onChange={(value) => updateField("sendFailureAlerts", value)}
              />
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-start">
          <Send
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
            aria-hidden="true"
          />
          <div>
            <h2 className="text-sm font-semibold text-amber-900">
              Before sending your first campaign
            </h2>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              Verify the default sender domain with your email provider and
              confirm that unsubscribe handling is active. These settings define
              defaults, but campaign creators should always review recipients
              and delivery details before sending.
            </p>
          </div>
        </section>

        <div className="flex justify-end pb-8">
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-gwc-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-gwc-navy focus:ring-offset-2"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            Save Changes
          </button>
        </div>
      </form>
    </main>
  );
}
