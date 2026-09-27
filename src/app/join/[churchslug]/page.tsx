"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  Heart,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type JoinPageProps = {
  params: {
    churchSlug: string;
  };
};

function formatChurchName(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function ChurchNewsletterJoinPage({ params }: JoinPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const churchName = useMemo(
    () => formatChurchName(params.churchSlug),
    [params.churchSlug]
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    window.setTimeout(() => {
      setIsSubmitting(false);
      setMessage(
        "Your signup is ready to submit. Connect this form to your public subscription and double-opt-in workflow."
      );
    }, 500);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-xl">
        <header className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gwc-navy text-lg font-bold text-white shadow-sm">
            {churchName
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((word) => word[0])
              .join("") || "CH"}
          </div>
          <p className="mt-5 text-sm font-semibold text-gwc-navy">
            {churchName}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Stay connected with your church family
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
            Sign up for the updates you care about. You can change your
            preferences or unsubscribe at any time.
          </p>
        </header>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex items-start gap-3 rounded-lg border border-gwc-gold/40 bg-amber-50 px-4 py-3">
            <Sparkles
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
              aria-hidden="true"
            />
            <p className="text-sm leading-6 text-amber-900">
              Welcome! Complete this short form to receive church news, events,
              and ministry updates by email.
            </p>
          </div>

          {message && (
            <div
              role="status"
              className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800"
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  First name
                </span>
                <input
                  required
                  name="firstName"
                  autoComplete="given-name"
                  placeholder="First name"
                  className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Last name
                </span>
                <input
                  required
                  name="lastName"
                  autoComplete="family-name"
                  placeholder="Last name"
                  className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Email address
              </span>
              <span className="relative mt-2 block">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  required
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full rounded-md border border-slate-200 py-3 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
                />
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Mobile number{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </span>
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="Optional mobile number"
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
              />
            </label>

            <fieldset>
              <legend className="text-sm font-semibold text-slate-700">
                Which updates would you like?
              </legend>
              <p className="mt-1 text-sm text-slate-500">
                Choose one or more email update types.
              </p>

              <div className="mt-3 space-y-3">
                <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4 transition hover:border-gwc-navy/30">
                  <input
                    defaultChecked
                    type="checkbox"
                    name="weeklyNewsletter"
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-gwc-navy focus:ring-gwc-navy"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">
                      Weekly church newsletter
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-500">
                      Church news, service highlights, events, and community
                      updates.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4 transition hover:border-gwc-navy/30">
                  <input
                    type="checkbox"
                    name="youthUpdates"
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-gwc-navy focus:ring-gwc-navy"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">
                      Youth ministry updates
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-500">
                      Youth events, gatherings, announcements, and serving
                      opportunities.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4 transition hover:border-gwc-navy/30">
                  <input
                    type="checkbox"
                    name="specialEvents"
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-gwc-navy focus:ring-gwc-navy"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">
                      Special events and announcements
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-slate-500">
                      Important church-wide announcements and special
                      gatherings.
                    </span>
                  </span>
                </label>
              </div>
            </fieldset>

            <label className="flex items-start gap-3 rounded-lg bg-slate-50 p-4">
              <input
                required
                type="checkbox"
                name="consent"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-gwc-navy focus:ring-gwc-navy"
              />
              <span className="text-sm leading-6 text-slate-600">
                I agree to receive the email updates selected above from{" "}
                {churchName}. I understand that I can unsubscribe or update my
                preferences at any time.
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gwc-navy px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Preparing your signup…" : "Join the newsletter"}
            </button>
          </form>

          <div className="mt-6 flex items-start gap-3 border-t border-slate-100 pt-5">
            <ShieldCheck
              className="mt-0.5 h-5 w-5 shrink-0 text-gwc-navy"
              aria-hidden="true"
            />
            <p className="text-xs leading-5 text-slate-500">
              We respect your privacy. Your preferences will be recorded and a
              confirmation email should be sent before your subscription becomes
              active.
            </p>
          </div>
        </section>

        <footer className="mt-6 flex flex-col items-center justify-center gap-2 text-center text-xs text-slate-400 sm:flex-row">
          <span className="inline-flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5" aria-hidden="true" /> {churchName}
          </span>
          <span className="hidden sm:block">•</span>
          <Link
            href="/login"
            className="font-medium text-slate-500 transition hover:text-gwc-navy"
          >
            Church staff sign in
          </Link>
        </footer>
      </div>
    </main>
  );
}
