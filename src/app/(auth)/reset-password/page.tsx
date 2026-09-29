import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { ResetPasswordForm } from "./reset-password-form";


export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  if (!token || error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <ShieldAlert
            className="mx-auto h-10 w-10 text-amber-500"
            aria-hidden="true"
          />
          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Reset link not valid
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            This password-reset link is invalid or has expired. Please request a
            new one.
          </p>
          <Link
            href="/forgot-password"
            className="mt-6 inline-flex w-full items-center justify-center rounded-md bg-gwc-navy px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Request a new link
          </Link>
        </div>
      </main>
    );
  }

  return <ResetPasswordForm token={token} />;
}
