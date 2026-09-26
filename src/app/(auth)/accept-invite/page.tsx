"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";

export default function AcceptInvitePage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
        "Invitation acceptance is ready to connect. Verify the invitation token server-side before creating an account or granting access."
      );
    }, 450);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:flex lg:items-center lg:justify-center">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="bg-gwc-navy p-7 text-white sm:p-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gwc-gold text-gwc-gold-text">
            <UserPlus className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-8 text-sm font-semibold text-gwc-gold">
            You are invited
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight">
            Join your church workspace
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-200">
            Create your secure account to collaborate on newsletters, members,
            and communications with your church team.
          </p>

          <div className="mt-8 rounded-xl border border-white/15 bg-white/10 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-gwc-gold">
                <Users className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">
                  Glory Worship Church
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-200">
                  Invited role:{" "}
                  <strong className="font-semibold text-white">Editor</strong>
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-300">
                  Scope example: Youth Ministry communications
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-start gap-3 text-sm leading-6 text-slate-200">
            <ShieldCheck
              className="mt-0.5 h-5 w-5 shrink-0 text-gwc-gold"
              aria-hidden="true"
            />
            You will only receive the permissions assigned in your invitation.
            Church Owners and administrators control organization-wide access.
          </div>
        </aside>

        <div className="p-7 sm:p-10">
          <p className="text-sm font-semibold text-gwc-navy">
            Accept invitation
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Use the email address that received the invitation. Your access
            begins after the invitation is verified.
          </p>

          {message && (
            <div
              role="status"
              className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800"
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Full name
              </span>
              <input
                required
                name="fullName"
                autoComplete="name"
                placeholder="Your full name"
                className="mt-2 w-full rounded-md border border-slate-200 px-3 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">
                Invitation email
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
                  placeholder="you@church.org"
                  className="w-full rounded-md border border-slate-200 py-3 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
                />
              </span>
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Create password
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
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
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
                  Confirm password
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
                    placeholder="Repeat password"
                    className="w-full rounded-md border border-slate-200 py-3 pl-10 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
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
            </div>

            <label className="flex items-start gap-2.5">
              <input
                required
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-gwc-navy focus:ring-gwc-navy"
              />
              <span className="text-sm leading-6 text-slate-600">
                I understand that my access is limited to the church role and
                ministry scope assigned by the invitation.
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gwc-navy px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Verifying invitation…"
                : "Accept invitation and continue"}
              {!isSubmitting && (
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-gwc-navy transition hover:opacity-75"
            >
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
