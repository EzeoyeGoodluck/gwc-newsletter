"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
   const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
     setError("");

    const { error } = await authClient.signIn.email({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message ?? "Sign-in failed");
      return;
    }
    router.push("/admin");
    router.refresh();

 

  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:flex lg:items-stretch lg:p-0">
      <section className="mx-auto flex w-full max-w-md flex-col justify-center py-8 lg:mx-0 lg:w-1/2 lg:max-w-none lg:px-16 xl:px-24">
        <Link href="/" className="inline-flex w-fit items-center gap-3 text-gwc-navy">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gwc-navy text-sm font-bold text-white shadow-sm">
            GWC
          </span>
          <span>
            <span className="block text-base font-bold leading-5">Sanctuary CMS</span>
            <span className="block text-xs text-slate-500">Church communications</span>
          </span>
        </Link>

        <div className="mt-12">
          <p className="text-sm font-semibold text-gwc-navy">Welcome back</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Sign in to your workspace</h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
            Manage newsletters, members, communication preferences, and church administration from one place.
          </p>
        </div>

        {message && (
          <div role="status" className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Email address</span>
            <span className="relative mt-2 block">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                required
                type="email"
                autoComplete="email"
                placeholder="you@church.org"
                className="w-full rounded-md border border-slate-200 py-3 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
              />
            </span>
          </label>

          <label className="block">
            <span className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
              Password
              <Link href="/forgot-password" className="font-medium text-gwc-navy transition hover:opacity-75">
                Forgot password?
              </Link>
            </span>
            <span className="relative mt-2 block">
              <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                required
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
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

          <label className="flex items-center gap-2.5 text-sm text-slate-600">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-gwc-navy focus:ring-gwc-navy" />
            Keep me signed in on this device
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gwc-navy px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Preparing sign in…" : "Sign in"}
            {!isSubmitting && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </button>
        </form>

        <div className="mt-7 rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-800">Need a church workspace?</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Create a workspace only if you are authorized to set up your church’s Sanctuary CMS account.
          </p>
          <Link href="/signup" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gwc-navy transition hover:opacity-75">
            Create church workspace
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Have a staff invitation?{" "}
          <Link href="/accept-invite" className="font-semibold text-gwc-navy transition hover:opacity-75">
            Accept invitation
          </Link>
        </p>
      </section>

      <aside className="relative hidden overflow-hidden bg-gwc-navy p-16 text-white lg:flex lg:w-1/2 lg:flex-col lg:justify-between xl:p-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(246,200,76,0.24),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.1),transparent_34%)]" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-gwc-gold">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            One place for church communication
          </span>
          <h2 className="mt-7 max-w-lg text-4xl font-bold leading-tight">
            Keep your congregation connected every week.
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-200">
            Create meaningful newsletters, manage member preferences, and give every ministry the right tools and access.
          </p>
        </div>
        <div className="relative rounded-xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
          <p className="text-sm font-semibold text-white">Built for your church team</p>
          <div className="mt-4 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
            <span>• Newsletter creation</span>
            <span>• Member audiences</span>
            <span>• Privacy controls</span>
            <span>• Role-based access</span>
          </div>
        </div>
      </aside>
    </main>
  );
}