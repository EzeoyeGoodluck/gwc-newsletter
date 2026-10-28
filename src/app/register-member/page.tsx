import Link from "next/link";

import { JoinForm } from "../../components/public/join-form";

export default function RegisterMemberPage() {
  return (
    <main className="min-h-screen bg-[#F5F7F9] px-4 py-8 text-[#002B3D] sm:py-12">
      <div className="mx-auto max-w-xl">
        <Link
          href="/"
          className="text-sm font-medium text-[#002B3D] hover:underline"
        >
          ← Back to home
        </Link>

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <header className="bg-[#002B3D] px-6 py-8 text-white sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FFD85B]">
              Glory Worship Church
            </p>

            <h1 className="mt-4 text-3xl font-semibold">
              Join our church community
            </h1>

            <p className="mt-3 text-sm leading-7 text-slate-200">
              Share your details so our church team can connect with you. You
              can also choose to receive our newsletter.
            </p>
          </header>

          <div className="p-6 sm:p-8">
            <JoinForm />
          </div>
        </section>

        <p className="mt-6 text-center text-xs leading-6 text-slate-500">
          Already registered? Contact the church team to update your contact
          details or newsletter preferences.
        </p>
      </div>
    </main>
  );
}
