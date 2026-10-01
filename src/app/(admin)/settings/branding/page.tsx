"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { getBrandingSettings, saveBrandingSettings } from "../actions";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  ImageUp,
  Mail,
  Palette,
  Save,
  Trash2,
  Type,
} from "lucide-react";

type BrandingForm = {
  displayName: string;
  primaryColor: string;
  accentColor: string;
  footerText: string;
  website: string;
};

const initialForm: BrandingForm = {
  displayName: "Glory Worship Church",
  primaryColor: "#06385B",
  accentColor: "#F6C84C",
  footerText:
    "Glory Worship Church · 125 Faith Avenue · Springfield, Illinois 62701",
  website: "www.gloryworshipchurch.org",
};

function isValidHexColor(value: string) {
  return /^#[0-9A-Fa-f]{6}$/.test(value);
}

export default function BrandingSettingsPage() {
  const [form, setForm] = useState<BrandingForm>(initialForm);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoName, setLogoName] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [removeLogoFlag, setRemoveLogoFlag] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getBrandingSettings().then((res) => {
      if (!res.ok) return setError(res.message);
      const { logoUrl, ...rest } = res.data;
      setForm(rest);
      setLogoPreview(logoUrl);
      setLogoName(logoUrl ? "Current logo" : null);
    });
  }, []);

  function updateField<K extends keyof BrandingForm>(
    field: K,
    value: BrandingForm[K]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setIsSaved(false);
  }

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/svg+xml"].includes(file.type)) {
      setError("Logo must be a PNG, JPG, or SVG file.");
      event.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Logo must be under 2 MB.");
      event.target.value = "";
      return;
    }

    setError(null);
    setLogoFile(file);
    setRemoveLogoFlag(false);
    setLogoPreview(URL.createObjectURL(file));
    setLogoName(file.name);
    setIsSaved(false);
  }

  function removeLogo() {
    setLogoPreview(null);
    setLogoName(null);
    setLogoFile(null);
    setRemoveLogoFlag(true);
    setIsSaved(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);

    const data = new FormData();
    data.set("displayName", form.displayName);
    data.set("primaryColor", form.primaryColor);
    data.set("accentColor", form.accentColor);
    data.set("footerText", form.footerText);
    data.set("website", form.website);
    data.set("removeLogo", String(removeLogoFlag));
    if (logoFile) data.set("logo", logoFile);

    const res = await saveBrandingSettings(data);
    setSaving(false);

    if (!res.ok) return setError(res.message);

    const { logoUrl, ...rest } = res.data;
    setForm(rest);
    setLogoPreview(logoUrl);
    setLogoName(logoUrl ? "Current logo" : null);
    setLogoFile(null);
    setRemoveLogoFlag(false);
    setIsSaved(true);
  }

  const primaryColor = isValidHexColor(form.primaryColor)
    ? form.primaryColor
    : initialForm.primaryColor;
  const accentColor = isValidHexColor(form.accentColor)
    ? form.accentColor
    : initialForm.accentColor;

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

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs text-slate-400">Settings</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gwc-navy">
              Branding &amp; Appearance
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Control the visual identity used across your CMS and in newsletter
              communications.
            </p>
          </div>

          <button
            type="submit"
            form="branding-settings-form"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-gwc-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-gwc-navy focus:ring-offset-2 disabled={saving}  disabled:opacity-60"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? "Saving..." : "Save Changes"}
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
          <p className="font-semibold">Branding saved successfully.</p>
        </div>
      )}

      <form
        id="branding-settings-form"
        onSubmit={handleSubmit}
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"
      >
        <div className="space-y-6">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-slate-100 px-6 py-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-gwc-navy">
                <ImageUp className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-800">
                  Organization logo
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Upload a clear logo for the CMS sidebar, newsletters, and
                  organization previews.
                </p>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <div
                  className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                  style={{
                    backgroundColor: logoPreview ? "white" : primaryColor,
                  }}
                >
                  {logoPreview ? (
                    // Preview is a local object/data URL chosen by the user.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoPreview}
                      alt="Selected organization logo"
                      className="h-full w-full object-contain p-2"
                    />
                  ) : (
                    <span className="text-center text-xs font-bold leading-4 text-white">
                      GWC
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    {logoName ?? "No custom logo uploaded"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    PNG, JPG, or SVG. For best results, use a square image at
                    least 256 × 256 pixels.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      <ImageUp className="h-4 w-4" aria-hidden="true" />
                      Upload logo
                    </button>

                    {logoPreview && (
                      <button
                        type="button"
                        onClick={removeLogo}
                        className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    onChange={handleLogoChange}
                    className="sr-only"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-slate-100 px-6 py-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-gwc-navy">
                <Type className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-800">
                  Display identity
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Choose how the organization name and footer details appear in
                  communications.
                </p>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Display name
                </span>
                <input
                  required
                  value={form.displayName}
                  onChange={(event) =>
                    updateField("displayName", event.target.value)
                  }
                  className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
                />
                <span className="mt-2 block text-xs text-slate-400">
                  Used in the sidebar, sender identity, and default newsletter
                  heading.
                </span>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Website display text
                </span>
                <input
                  value={form.website}
                  onChange={(event) =>
                    updateField("website", event.target.value)
                  }
                  className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Email footer details
                </span>
                <textarea
                  rows={3}
                  value={form.footerText}
                  onChange={(event) =>
                    updateField("footerText", event.target.value)
                  }
                  className="mt-2 w-full resize-y rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
                />
                <span className="mt-2 block text-xs text-slate-400">
                  Include an organization address and any required newsletter or
                  compliance information.
                </span>
              </label>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start gap-3 border-b border-slate-100 px-6 py-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-gwc-navy">
                <Palette className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-800">
                  Brand colors
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Colors are used in email headers, calls to action, and other
                  branded CMS elements.
                </p>
              </div>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Primary color
                </span>
                <span className="mt-2 flex overflow-hidden rounded-md border border-slate-200">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(event) =>
                      updateField(
                        "primaryColor",
                        event.target.value.toUpperCase()
                      )
                    }
                    className="h-11 w-12 cursor-pointer border-0 bg-transparent p-1"
                    aria-label="Choose primary color"
                  />
                  <input
                    value={form.primaryColor}
                    onChange={(event) =>
                      updateField(
                        "primaryColor",
                        event.target.value.toUpperCase()
                      )
                    }
                    pattern="^#[0-9A-Fa-f]{6}$"
                    aria-label="Primary color hex value"
                    className="min-w-0 flex-1 border-l border-slate-200 px-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-inset focus:ring-gwc-navy/10"
                  />
                </span>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Accent color
                </span>
                <span className="mt-2 flex overflow-hidden rounded-md border border-slate-200">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(event) =>
                      updateField(
                        "accentColor",
                        event.target.value.toUpperCase()
                      )
                    }
                    className="h-11 w-12 cursor-pointer border-0 bg-transparent p-1"
                    aria-label="Choose accent color"
                  />
                  <input
                    value={form.accentColor}
                    onChange={(event) =>
                      updateField(
                        "accentColor",
                        event.target.value.toUpperCase()
                      )
                    }
                    pattern="^#[0-9A-Fa-f]{6}$"
                    aria-label="Accent color hex value"
                    className="min-w-0 flex-1 border-l border-slate-200 px-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-inset focus:ring-gwc-navy/10"
                  />
                </span>
              </label>
            </div>
          </section>
        </div>

        <aside className="h-fit xl:sticky xl:top-6">
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-gwc-navy">
                <Eye className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Newsletter preview
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  A live branding example
                </p>
              </div>
            </div>

            <div className="bg-slate-100 p-5">
              <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                <div
                  className="px-6 py-6 text-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  {logoPreview ? (
                    // Preview is a local object/data URL chosen by the user.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoPreview}
                      alt={`${form.displayName || "Organization"} logo preview`}
                      className="mx-auto h-10 max-w-[160px] object-contain"
                    />
                  ) : (
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 text-xs font-bold text-white">
                      {form.displayName
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((word) => word[0])
                        .join("") || "GW"}
                    </span>
                  )}
                  <h3 className="mt-3 text-base font-bold text-white">
                    {form.displayName || "Your Organization"}
                  </h3>
                </div>

                <div className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    This week at church
                  </p>
                  <h3 className="mt-2 text-lg font-bold text-slate-800">
                    Stay connected with your community
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    Share ministry news, upcoming gatherings, and encouraging
                    updates with your congregation.
                  </p>
                  <span
                    className="mt-5 inline-flex rounded-md px-4 py-2 text-xs font-semibold"
                    style={{
                      backgroundColor: accentColor,
                      color: primaryColor,
                    }}
                  >
                    Read more
                  </span>
                </div>

                <div className="border-t border-slate-100 px-6 py-4">
                  <p className="text-[10px] leading-4 text-slate-400">
                    {form.footerText ||
                      "Your organization footer details will appear here."}
                  </p>
                  <p
                    className="mt-2 text-[10px] font-medium"
                    style={{ color: primaryColor }}
                  >
                    {form.website || "yourorganization.org"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex gap-3">
              <Mail
                className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
                aria-hidden="true"
              />
              <div>
                <h2 className="text-sm font-semibold text-amber-900">
                  Email consistency
                </h2>
                <p className="mt-1 text-xs leading-5 text-amber-800">
                  Review the preview before saving. Brand colors should preserve
                  readable text contrast, especially in email buttons and
                  headers.
                </p>
              </div>
            </div>
          </section>
        </aside>

        <div className="flex justify-end xl:col-span-2">
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-gwc-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-gwc-navy focus:ring-offset-2 disabled={saving} disabled:opacity-60 "
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </main>
  );
}
