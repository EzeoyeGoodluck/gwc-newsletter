"use client";

import { useRef, useState, type FormEvent } from "react";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

import { joinChurch } from "../../app/register-member/actions";

type JoinCategory = {
  id: string;
  name: string;
};

type JoinFormProps = {
  categories?: JoinCategory[];
};

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[#002B3D] outline-none focus:border-[#002B3D] focus:ring-2 focus:ring-[#002B3D]/10 disabled:opacity-60";

export function JoinForm({ categories = [] }: JoinFormProps) {
  const [pending, setPending] = useState(false);

  const [success, setSuccess] = useState(false);

  const [error, setError] = useState("");

  const [challengeToken, setChallengeToken] = useState("");

  const pendingRef = useRef(false);

  const turnstileRef = useRef<TurnstileInstance | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pendingRef.current) {
      return;
    }

    if (!siteKey) {
      setError(
        "The joining form is not configured yet. Please contact the church team."
      );
      return;
    }

    if (!challengeToken) {
      setError("Please complete the security check.");
      return;
    }

    const formData = new FormData(event.currentTarget);

    formData.set("turnstileToken", challengeToken);

    pendingRef.current = true;
    setPending(true);
    setError("");

    let submissionSucceeded = false;

    try {
      const result = await joinChurch(formData);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      submissionSucceeded = true;
      setSuccess(true);
    } catch {
      setError("Your submission could not be confirmed. Please try again.");
    } finally {
      pendingRef.current = false;
      setPending(false);
      setChallengeToken("");

      if (!submissionSucceeded) {
        turnstileRef.current?.reset();
      }
    }
  }

  if (success) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6"
      >
        <h2 className="text-xl font-semibold text-[#002B3D]">
          Thank you for connecting with us
        </h2>

        <p className="mt-3 text-sm leading-7 text-slate-700">
          Your request has been processed. For new registrations, we save your
          contact details and any categories you selected.
        </p>

        <p className="mt-3 text-sm leading-7 text-slate-700">
          If this email is already registered, its existing details, categories,
          and newsletter preferences remain unchanged. Please contact the church
          team to update them.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} aria-busy={pending} className="space-y-5">
      <div>
        <label
          htmlFor="join-name"
          className="text-sm font-semibold text-[#002B3D]"
        >
          Full name
        </label>

        <input
          id="join-name"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          minLength={2}
          maxLength={120}
          disabled={pending}
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="join-email"
          className="text-sm font-semibold text-[#002B3D]"
        >
          Email address
        </label>

        <input
          id="join-email"
          name="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={254}
          disabled={pending}
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="join-phone"
          className="text-sm font-semibold text-[#002B3D]"
        >
          Phone number{" "}
          <span className="font-normal text-slate-500">(optional)</span>
        </label>

        <input
          id="join-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          maxLength={40}
          disabled={pending}
          className={inputClass}
        />
      </div>

      <fieldset
        disabled={pending}
        aria-describedby="join-categories-help"
        className="rounded-2xl border border-slate-200 p-4"
      >
        <legend className="px-1 text-sm font-semibold text-[#002B3D]">
          Choose your categories
        </legend>

        <p
          id="join-categories-help"
          className="text-sm leading-6 text-slate-600"
        >
          Select the categories you would like to join. You can choose more than
          one, or leave them unchecked if you are not sure yet.
        </p>

        {categories.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-[#002B3D]"
              >
                <input
                  name="categoryIds"
                  type="checkbox"
                  value={category.id}
                  className="mt-1 h-4 w-4 shrink-0 accent-[#002B3D]"
                />

                <span>{category.name}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm leading-6 text-slate-500">
            No categories are currently available for public selection. You can
            still complete your registration.
          </p>
        )}

        <p className="mt-3 text-xs leading-5 text-slate-500">
          Categories are only added when you select them. Category selection
          does not subscribe you to newsletter emails.
        </p>
      </fieldset>

      <div
        aria-hidden="true"
        className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden"
      >
        <label htmlFor="join-website">Leave this field empty</label>

        <input
          id="join-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <label className="flex items-start gap-3 text-sm leading-6 text-slate-600">
        <input
          name="recordConsent"
          type="checkbox"
          required
          disabled={pending}
          className="mt-1 h-4 w-4 shrink-0 accent-[#002B3D]"
        />

        <span>
          I agree that Glory Worship Church may store and use these details and
          my category selections to manage my church contact record and respond
          to this request.
        </span>
      </label>

      <label className="flex items-start gap-3 text-sm leading-6 text-slate-600">
        <input
          name="newsletterConsent"
          type="checkbox"
          disabled={pending}
          className="mt-1 h-4 w-4 shrink-0 accent-[#002B3D]"
        />

        <span>
          I would like to receive Glory Worship Church newsletter emails. I can
          unsubscribe at any time.{" "}
          <span className="text-slate-500">(Optional)</span>
        </span>
      </label>

      {siteKey ? (
        <div className="overflow-x-auto">
          <Turnstile
            ref={turnstileRef}
            siteKey={siteKey}
            options={{
              action: "member-join",
              theme: "light",
            }}
            onSuccess={(token) => {
              setChallengeToken(token);
            }}
            onExpire={() => {
              setChallengeToken("");
            }}
            onTimeout={() => {
              setChallengeToken("");
            }}
            onError={() => {
              setChallengeToken("");
              setError(
                "The security check could not load. Please refresh and try again."
              );
            }}
          />
        </div>
      ) : (
        <p
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          The joining form is not configured yet. Please contact the church
          team.
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !siteKey || !challengeToken}
        className="w-full cursor-pointer rounded-xl bg-[#002B3D] px-5 py-3.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Submitting…" : "Join our community"}
      </button>

      <p className="text-xs leading-6 text-slate-500">
        Submitting this form creates a contact request, not a staff login or
        automatic approval of church membership. Category selection and
        newsletter signup are optional.
      </p>
    </form>
  );
}
