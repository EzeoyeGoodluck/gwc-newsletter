"use client";
import { FormEvent, useEffect, useState } from "react";
import { getOrganizationSettings, saveOrganizationSettings } from "../actions";
import { useBranding } from "@/lib/branding-context";

import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Globe2,
  MapPin,
  Save,
} from "lucide-react";

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

const languages = [
  { value: "en-US", label: "English (United States)" },
  { value: "en-GB", label: "English (United Kingdom)" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "pt", label: "Portuguese" },
];

type OrganizationForm = {
  organizationName: string;
  publicEmail: string;
  phone: string;
  website: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  timeZone: string;
  language: string;
};

const initialForm: OrganizationForm = {
  organizationName: "Glory Worship Church",
  publicEmail: "hello@gloryworshipchurch.org",
  phone: "+1 (555) 014-2024",
  website: "https://www.gloryworshipchurch.org",
  addressLine1: "125 Faith Avenue",
  addressLine2: "",
  city: "Springfield",
  stateProvince: "Illinois",
  postalCode: "62701",
  country: "United States",
  timeZone: "America/Chicago",
  language: "English (United States)",
};

export default function OrganizationSettingsPage() {
  const [form, setForm] = useState<OrganizationForm>(initialForm);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setBranding } = useBranding();

  useEffect(() => {
    getOrganizationSettings().then((res) => {
      setLoading(false);
      if (!res.ok) return setError(res.message);
      setForm(res.data);
    });
  }, []);

  function updateField<K extends keyof OrganizationForm>(
    field: K,
    value: OrganizationForm[K]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setIsSaved(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);

    const res = await saveOrganizationSettings(form);
    setSaving(false);

    if (!res.ok) return setError(res.message);

    setForm(res.data);
    setBranding({ name: res.data.organizationName });
    setIsSaved(true);
  }

  const timeZoneOptions = timeZones.includes(form.timeZone)
    ? timeZones
    : [form.timeZone, ...timeZones];

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
              Organization Profile
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Manage your church identity, contact information, address, and
              regional preferences.
            </p>
          </div>

          <button
            type="submit"
            form="organization-settings-form"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-gwc-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-gwc-navy focus:ring-offset-2"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            Save Changes
          </button>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {isSaved && (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
            aria-hidden="true"
          />
          <p className="font-semibold">Organization profile saved.</p>
        </div>
      )}

      <form
        id="organization-settings-form"
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-slate-100 px-6 py-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-gwc-navy">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Organization information
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                These details identify your church across the CMS and in
                organization communications.
              </p>
            </div>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">
                Organization name
              </span>
              <input
                required
                value={form.organizationName}
                onChange={(event) =>
                  updateField("organizationName", event.target.value)
                }
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Public email address
              </span>
              <input
                required
                type="email"
                value={form.publicEmail}
                onChange={(event) =>
                  updateField("publicEmail", event.target.value)
                }
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Primary phone number
              </span>
              <input
                type="tel"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">
                Website
              </span>
              <input
                type="url"
                value={form.website}
                onChange={(event) => updateField("website", event.target.value)}
                placeholder="https://example.org"
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
              />
            </label>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-slate-100 px-6 py-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-gwc-navy">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Organization address
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Keep this address accurate for public contact details and
                required communication footers.
              </p>
            </div>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">
                Address line 1
              </span>
              <input
                required
                value={form.addressLine1}
                onChange={(event) =>
                  updateField("addressLine1", event.target.value)
                }
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
              />
            </label>

            <label className="block md:col-span-2">
              <span className="text-sm font-semibold text-slate-700">
                Address line 2{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </span>
              <input
                value={form.addressLine2}
                onChange={(event) =>
                  updateField("addressLine2", event.target.value)
                }
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">City</span>
              <input
                required
                value={form.city}
                onChange={(event) => updateField("city", event.target.value)}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                State / province
              </span>
              <input
                value={form.stateProvince}
                onChange={(event) =>
                  updateField("stateProvince", event.target.value)
                }
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Postal code
              </span>
              <input
                value={form.postalCode}
                onChange={(event) =>
                  updateField("postalCode", event.target.value)
                }
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Country
              </span>
              <input
                required
                value={form.country}
                onChange={(event) => updateField("country", event.target.value)}
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
              />
            </label>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start gap-3 border-b border-slate-100 px-6 py-5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-gwc-navy">
              <Globe2 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Regional preferences
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                These preferences are used for scheduling, timestamps, and
                future localized communication settings.
              </p>
            </div>
          </div>

          <div className="grid gap-5 p-6 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Time zone
              </span>
              <select
                value={form.timeZone}
                onChange={(event) =>
                  updateField("timeZone", event.target.value)
                }
                className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
              >
                {timeZoneOptions.map((timeZone) => (
                  <option key={timeZone} value={timeZone}>
                    {timeZone}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Default language
              </span>
              <select
                value={form.language}
                onChange={(event) =>
                  updateField("language", event.target.value)
                }
                className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-sm font-semibold text-amber-900">
            Where these details are used
          </h2>
          <p className="mt-1 text-sm leading-6 text-amber-800">
            Your organization name and address may appear in newsletter footers,
            account records, privacy communications, and other required
            administrative notices.
          </p>
        </section>

        <div className="flex justify-end pb-8">
          <button
            type="submit"
            form="organization-settings-form"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-gwc-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-gwc-navy focus:ring-offset-2  disabled={saving || loading} disabled:opacity-60"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </main>
  );
}
