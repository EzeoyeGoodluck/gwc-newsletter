import Link from "next/link";
import { CheckCircle2, Heart, MailCheck, ShieldCheck } from "lucide-react";

type JoinSuccessPageProps = {
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

export default function ChurchNewsletterJoinSuccessPage({ params }: JoinSuccessPageProps) {
  const churchName = formatChurchName(params.churchSlug);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 sm:px-6">
      <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
        </div>

        <p className="mt-6 text-sm font-semibold text-gwc-navy">{churchName}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Check your inbox</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
          We have received your newsletter preferences. Please use the confirmation link in your email to complete your subscription.
        </p>

        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-5 text-left">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-gwc-navy shadow-sm">
              <MailCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">One more step</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Confirming your email helps protect your inbox and ensures that only you can subscribe this address.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-left">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
            <p className="text-sm leading-6 text-amber-900">
              If you do not see a confirmation email within a few minutes, check your spam or promotions folder. You can safely ignore the email if you did not request this subscription.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6">
          <p className="text-sm text-slate-500">Thank you for staying connected with your church family.</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-500">
            <Heart className="h-4 w-4 text-gwc-gold" aria-hidden="true" />
            {churchName}
          </div>
        </div>

        <Link href={`/join/${params.churchSlug}`} className="mt-7 inline-flex text-sm font-semibold text-gwc-navy transition hover:opacity-75">
          Return to newsletter signup
        </Link>
      </section>
    </main>
  );
}