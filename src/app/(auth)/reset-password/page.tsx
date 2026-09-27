"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match. Please check them and try again.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    window.setTimeout(() => {
      setIsSubmitting(false);
      setMessage(
        "Your new password is ready to save. Connect this screen to a verified, time-limited reset token before enabling it."
      );
    }, 450);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 sm:px-6">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-gwc-navy">
          <KeyRound className="h-6 w-6" aria-hidden="true" />
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
          Choose a new password
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Use a strong password that you do not reuse on another account.
        </p>

        {message && (
          <div
            role="status"
            className="mt-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800"
          >
            <ShieldCheck
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
              aria-hidden="true"
            />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              New password
            </span>
            <span className="relative mt-2 block">
              <LockKeyhole
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                required
                minLength={8}
                name="password"
                autoComplete="new-password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                className="w-full rounded-md border border-slate-200 py-3 pl-10 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:text-gwc-navy"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">
              Confirm new password
            </span>
            <span className="relative mt-2 block">
              <LockKeyhole
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                required
                minLength={8}
                name="confirmPassword"
                autoComplete="new-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Repeat your new password"
                className="w-full rounded-md border border-slate-200 py-3 pl-10 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:text-gwc-navy"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </span>
          </label>

          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">
              Choose a strong password
            </p>
            <ul className="mt-2 space-y-1.5 text-xs leading-5 text-slate-500">
              <li className="flex items-center gap-2">
                <CheckCircle2
                  className="h-3.5 w-3.5 text-gwc-navy"
                  aria-hidden="true"
                />{" "}
                At least 8 characters
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2
                  className="h-3.5 w-3.5 text-gwc-navy"
                  aria-hidden="true"
                />{" "}
                A mix of letters, numbers, and symbols is recommended
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2
                  className="h-3.5 w-3.5 text-gwc-navy"
                  aria-hidden="true"
                />{" "}
                Do not reuse a password from another service
              </li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gwc-navy px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Preparing password update…" : "Set new password"}
            {!isSubmitting && (
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link
            href="/login"
            className="font-semibold text-gwc-navy transition hover:opacity-75"
          >
            Return to sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
