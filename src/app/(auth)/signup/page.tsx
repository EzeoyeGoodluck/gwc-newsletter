"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound, Building2 } from "lucide-react";

export default function SignupPage() {
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
      setMessage("Workspace creation is ready to connect. Add authentication and organization onboarding to continue.");
    }, 450);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:flex lg:items-stretch lg:p-0">
      <aside className="relative hidden overflow-hidden bg-gwc-navy p-16 text-white lg:flex lg:w-[44%] lg:flex-col lg:justify-between xl:p-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(246,200,76,0.25),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.1),transparent_38%)]" />
        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-3 text-white">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gwc-gold text-sm font-bold text-gwc-gold-text shadow-sm">
              GWC
            </span>
            <span>
              <span className="block text-base font-bold leading-5">Sanctuary CMS</span>
              <span className="block text-xs text-slate-300">Church communications</span>
            </span>
          </Link>
          <h1 className="mt-16 max-w-md text-4xl font-bold leading-tight">
            Start with a workspace built for your church.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-200">
            Set up the organization, choose who can help, and create a reliable home for newsletters and member communication.
          </p>
        </div>
        <div className="relative space-y-3">
          {[
            "Create your organization profile",
            "Set up trusted staff access",
            "Start communicating with your congregation",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm text-slate-100">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-gwc-gold" aria-hidden="true" />
              {item}
            </div>
          ))}
        </div>
      </aside>

      <section className="mx-auto flex w-full max-w-xl flex-col justify-center py-8 lg:mx-0 lg:w-[56%] lg:max-w-none lg:px-16 xl:px-24">
        <Link href="/" className="inline-flex w-fit items-center gap-3 text-gwc-navy lg:hidden">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gwc-navy text-sm font-bold text-white shadow-sm">GWC</span>
          <span>
            <span className="block text-base font-bold leading-5">Sanctuary CMS</span>
            <span className="block text-xs text-slate-500">Church communications</span>
          </span>
        </Link>

        <div className="mt-10 lg:mt-0">
          <p className="text-sm font-semibold text-gwc-navy">Create workspace</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Set up your church account</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
            This creates the first Owner account for your church. Invite additional staff after setup is complete.
          </p>
        </div>

        {message && (
          <div
            role="status"
            className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800"
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 grid gap-5 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Your full name</span>
            <span className="relative mt-2 block">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                required
                name="fullName"
                autoComplete="name"
                placeholder="Pastor or administrator name"
                className="w-full rounded-md border border-slate-200 py-3 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
              />
            </span>
          </label>

          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Church or organization name</span>
            <span className="relative mt-2 block">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                required
                name="organizationName"
                placeholder="Glory Worship Church"
                className="w-full rounded-md border border-slate-200 py-3 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
              />
            </span>
          </label>

          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Work email address</span>
            <span className="relative mt-2 block">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
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

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Password</span>
            <span className="relative mt-2 block">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                required
                minLength={8}
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="w-full rounded-md border border-slate-200 py-3 pl-10 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:text-gwc-navy"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Confirm password</span>
            <span className="relative mt-2 block">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                required
                minLength={8}
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repeat your password"
                className="w-full rounded-md border border-slate-200 py-3 pl-10 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:text-gwc-navy"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
          </label>

          <label className="flex items-start gap-2.5 sm:col-span-2">
            <input required type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-gwc-navy focus:ring-gwc-navy" />
            <span className="text-sm leading-6 text-slate-600">
              I confirm that I am authorized to create and manage this church workspace.
            </span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gwc-navy px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2"
          >
            {isSubmitting ? "Preparing workspace…" : "Create workspace"}
            {!isSubmitting && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </button>
        </form>

        <div className="mt-6 flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gwc-navy" aria-hidden="true" />
          <p className="text-sm leading-6 text-slate-500">
            Your account becomes the workspace Owner. You can later invite trusted administrators, editors, and viewers with only the access they need.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have a workspace?{" "}
          <Link href="/login" className="font-semibold text-gwc-navy transition hover:opacity-75">
            Sign in
          </Link>
          <span className="mx-2 text-slate-300">•</span>
          <Link href="/accept-invite" className="font-semibold text-gwc-navy transition hover:opacity-75">
            Accept an invitation
          </Link>
        </p>
      </section>
    </main>
  );
}