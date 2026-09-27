"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  KeyRound,
  Mail,
  ShieldCheck,
} from "lucide-react";

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    window.setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 450);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 sm:px-6">
      <section className="w-full max-w-md">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-gwc-navy"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to sign in
        </Link>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-gwc-navy">
            <KeyRound className="h-6 w-6" aria-hidden="true" />
          </div>

          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
            Reset your password
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Enter the email address associated with your church workspace. We
            will send reset instructions if an account exists.
          </p>

          {isSubmitted ? (
            <div className="mt-6">
              <div
                role="status"
                className="rounded-lg border border-emerald-200 bg-emerald-50 p-4"
              >
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />
                  <div>
                    <h2 className="text-sm font-semibold text-emerald-900">
                      Check your email
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-emerald-800">
                      If an account matches that address, password-reset
                      instructions will be sent shortly.
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-500">
                This UI uses a generic confirmation message intentionally. When
                connected, the backend should not reveal whether an email
                address has an account.
              </p>

              <Link
                href="/login"
                className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-gwc-navy px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Return to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
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
                    type="email"
                    autoComplete="email"
                    placeholder="you@church.org"
                    className="w-full rounded-md border border-slate-200 py-3 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
                  />
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gwc-navy px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Preparing reset…" : "Send reset instructions"}
                {!isSubmitting && (
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Remembered your password?{" "}
          <Link
            href="/login"
            className="font-semibold text-gwc-navy transition hover:opacity-75"
          >
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
