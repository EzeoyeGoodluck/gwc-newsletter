"use client";

import { Suspense, useRef, useState, type FormEvent } from "react";

import { useSearchParams } from "next/navigation";

import { unsubscribeMember } from "@/lib/unsubscribe-actions";

interface UnsubscribeFormProps {
  token: string;
}

function UnsubscribeForm({ token }: UnsubscribeFormProps) {
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const pendingRef = useRef(false);

  const validToken =
    token.length >= 16 && token.length <= 200 && /^[a-zA-Z0-9_-]+$/.test(token);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pendingRef.current || success || !validToken) {
      return;
    }

    pendingRef.current = true;
    setPending(true);
    setError("");

    try {
      const result = await unsubscribeMember(token);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setSuccess(true);
    } catch {
      setError(
        "We could not confirm your subscription update. Please try again."
      );
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F6F8] px-4 py-12">
      <section className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="bg-[#002B3D] px-6 py-7 text-center text-white">
          <p className="text-xl font-semibold">Glory Worship Church</p>

          <p className="mt-2 text-sm text-white/75">Newsletter subscription</p>
        </header>

        <div className="p-6 sm:p-8">
          {!validToken ? (
            <>
              <h1 className="text-xl font-semibold text-[#002B3D]">
                Invalid unsubscribe link
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Please open the unsubscribe link from the newsletter you
                received.
              </p>
            </>
          ) : success ? (
            <div role="status" aria-live="polite">
              <h1 className="text-xl font-semibold text-[#002B3D]">
                You are unsubscribed
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                You will no longer receive our newsletter emails unless you
                subscribe again.
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                This only changes your email subscription. Your church
                membership is not affected.
              </p>

              <p className="mt-5 text-xs leading-5 text-slate-500">
                An email already being sent may still arrive. You can close this
                page.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-[#002B3D]">
                Unsubscribe from newsletters?
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Confirm below to stop receiving newsletter emails from Glory
                Worship Church.
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Your church membership will not be changed.
              </p>

              <form onSubmit={handleSubmit} className="mt-6">
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full cursor-pointer rounded-lg bg-[#002B3D] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? "Updating subscription…" : "Unsubscribe"}
                </button>
              </form>

              {error && (
                <p
                  role="alert"
                  className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm leading-6 text-red-700"
                >
                  {error}
                </p>
              )}

              <p className="mt-5 text-xs leading-5 text-slate-500">
                Changed your mind? Close this page without pressing Unsubscribe
                to keep your subscription.
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function UnsubscribePageContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  return <UnsubscribeForm key={token} token={token} />;
}

export default function UnsubscribePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#F4F6F8] px-4">
          <p className="text-sm text-slate-600">Loading subscription page…</p>
        </main>
      }
    >
      <UnsubscribePageContent />
    </Suspense>
  );
}
