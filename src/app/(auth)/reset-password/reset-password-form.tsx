"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const data = new FormData(event.currentTarget);
    const newPassword = String(data.get("password") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match. Please check them and try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await authClient.resetPassword({ newPassword, token });

      if (error) {
        setMessage(
          error.message ??
            "This reset link is invalid or has expired. Please request a new one."
        );
        return;
      }

      setIsDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch {
      setMessage(
        "Something went wrong. Please check your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 sm:px-6">
      <section className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-gwc-navy">
            <KeyRound className="h-6 w-6" aria-hidden="true" />
          </div>

          <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
            Choose a new password
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            For your security, you will be signed out on all other devices after
            the change.
          </p>

          {isDone ? (
            <div
              role="status"
              className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                <div>
                  <h2 className="text-sm font-semibold text-emerald-900">
                    Password updated
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-emerald-800">
                    Taking you to sign in…{" "}
                    <Link href="/login" className="font-semibold underline">
                      Sign in now
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {message && (
                <div
                  role="alert"
                  className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800"
                >
                  {message}
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
                      onClick={() => setShowPassword((c) => !c)}
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
                      type={showPassword ? "text" : "password"}
                      placeholder="Repeat your new password"
                      className="w-full rounded-md border border-slate-200 py-3 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
                    />
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gwc-navy px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Updating…" : "Update password"}
                  {!isSubmitting && (
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
