import { JoinQrCode } from "@/components/public/join-qr-code";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F5F7F9] text-[#002B3D]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#002B3D] text-xs font-bold text-[#FFD85B]">
              GWC
            </span>

            <span className="text-sm font-semibold leading-5 sm:text-base">
              Glory Worship
              <br />
              Church
            </span>
          </Link>

          <nav aria-label="Main navigation" className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-slate-600 hover:text-[#002B3D]"
            >
              Staff access
            </Link>

            <Link
              href="/join"
              className="rounded-lg bg-[#FFD85B] px-4 py-2.5 text-sm font-semibold text-[#493A0B]"
            >
              Join our community
            </Link>
          </nav>
        </div>
      </header>

      <section className="bg-[#002B3D] text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#FFD85B]">
            Welcome to Glory Worship Church
          </p>

          <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            A place to connect,
            <br />
            grow, and belong.
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-slate-200 sm:text-lg">
            Stay connected with our church family. Receive encouragement, church
            news, and opportunities to worship and serve together.
          </p>

          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              href="/join"
              className="rounded-xl bg-[#FFD85B] px-6 py-3.5 text-sm font-semibold text-[#493A0B] transition hover:brightness-105"
            >
              Join our community
            </Link>

            <a
              href="#scan-to-join"
              className="rounded-xl border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Scan to join
            </a>
          </div>
        </div>
      </section>

      <section
        id="scan-to-join"
        className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:py-20"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            Stay connected
          </p>

          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Church updates,
            <br />
            wherever you are.
          </h2>

          <p className="mt-5 max-w-lg text-base leading-8 text-slate-600">
            Share your details through our simple joining form. Our team can
            welcome you, and you can choose to receive newsletter updates.
          </p>

          <ul className="mt-7 space-y-4 text-sm text-slate-700">
            {[
              "Church news and weekly encouragement",
              "Upcoming events and ministry activities",
              "Opportunities to connect and serve",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#D4AD30]"
                />

                <span>{item}</span>
              </li>
            ))}
          </ul>

          <p className="mt-7 text-sm leading-6 text-slate-500">
            Newsletter signup is optional. Newsletter recipients can unsubscribe
            using the link at the bottom of their emails.
          </p>
        </div>

        <JoinQrCode />
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-slate-500 sm:px-8">
          <p>Glory Worship Church</p>

          <Link href="/join" className="font-medium text-[#002B3D]">
            Connect with us
          </Link>
        </div>
      </footer>
    </main>
  );
}
