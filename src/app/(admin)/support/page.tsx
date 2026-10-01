"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  FileText,
  HelpCircle,
  LifeBuoy,
  Loader2,
  Mail,
  Search,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";
import { submitSupportRequest, getSystemStatus, SystemStatus } from "./actions";

const quickActions = [
  {
    title: "Create a Newsletter",
    description: "Start a new newsletter from a template or a blank layout.",
    href: "/templates/create",
    icon: Send,
  },
  {
    title: "Manage Members",
    description: "Find, add, update, or organize people in your directory.",
    href: "/members",
    icon: Users,
  },
  {
    title: "Privacy & GDPR",
    description: "Review consent records and member privacy controls.",
    href: "/privacy-gdpr",
    icon: ShieldCheck,
  },
];

type Guide = {
  title: string;
  keywords: string;
  steps: string[];
  href: string;
  linkLabel: string;
};

const guides: Guide[] = [
  {
    title: "How to create and send a newsletter",
    keywords: "newsletter send email template schedule campaign",
    steps: [
      "Click Create Newsletter in the sidebar.",
      "Pick a template or start blank, then add your content.",
      "Choose who receives it: all members or specific groups.",
      "Send a test copy to yourself and check it on your phone.",
      "Send now or schedule it for later.",
    ],
    href: "/templates/create",
    linkLabel: "Create a newsletter",
  },
  {
    title: "How to add or import members",
    keywords: "members import csv add directory contacts subscribers",
    steps: [
      "Open Members from the sidebar.",
      "Use Add Member for one person, or Import to upload a CSV file.",
      "Only import people who have agreed to receive email.",
      "Assign members to groups so you can target newsletters.",
    ],
    href: "/members",
    linkLabel: "Go to Members",
  },
  {
    title: "How to edit templates and apply branding",
    keywords: "template branding logo colors footer design",
    steps: [
      "Go to Settings → Branding & Appearance.",
      "Upload your logo and set your primary and accent colors.",
      "Add your church address to the email footer.",
      "Open Templates to edit layouts. Your branding is applied automatically.",
    ],
    href: "/settings/branding",
    linkLabel: "Open Branding",
  },
  {
    title: "How to manage team roles and permissions",
    keywords: "team invite role permission admin editor viewer owner access",
    steps: [
      "Go to Settings → Team & Permissions.",
      "Click Invite Team Member, enter their email, and choose a role.",
      "They'll receive an email link to create their account (it expires in 7 days).",
      "Use the ⋯ menu next to a person to change their role or remove access.",
    ],
    href: "/settings/users",
    linkLabel: "Open Team & Permissions",
  },
  {
    title: "How to manage consent and GDPR requests",
    keywords:
      "privacy gdpr consent unsubscribe export erase delete data request",
    steps: [
      "Open Privacy & GDPR and search for the member.",
      "To stop emails, choose Withdraw email consent and record how they asked.",
      "To give them a copy of their data, choose Export member data.",
      "To delete their information, export first if needed, then choose Erase personal data.",
    ],
    href: "/privacy-gdpr",
    linkLabel: "Open Privacy & GDPR",
  },
  {
    title: "How to connect or change the email service",
    keywords:
      "smtp email brevo namecheap resend integration sending not working spam",
    steps: [
      "Go to Settings → Integrations and click Add SMTP connection.",
      "Pick your provider, enter the login details, and save.",
      "Click Test connection, then send a test email to yourself.",
      "Click Activate to use it for all outgoing email.",
    ],
    href: "/settings/integrations",
    linkLabel: "Open Integrations",
  },
];

const CATEGORIES = [
  "Newsletters & Templates",
  "Members & Directory",
  "Settings & Access",
  "Privacy & GDPR",
  "Technical issue",
];

function StatusBar({ status }: { status: SystemStatus | null }) {
  if (!status) {
    return (
      <section className="mt-7 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Checking system status…
      </section>
    );
  }

  const problems: string[] = [];
  if (!status.database) problems.push("The database is not responding.");
  if (status.email === "not_configured")
    problems.push("No email service is active, so emails can't be sent.");
  if (status.email === "failing")
    problems.push(
      `The email connection "${status.emailProvider}" failed its last test.`
    );
  if (status.email === "untested")
    problems.push(
      `The email connection "${status.emailProvider}" hasn't been tested yet.`
    );

  const healthy = problems.length === 0;

  return (
    <section
      className={`mt-7 flex flex-col gap-3 rounded-xl border px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
        healthy
          ? "border-emerald-200 bg-emerald-50"
          : "border-amber-200 bg-amber-50"
      }`}
    >
      <div className="flex items-start gap-3">
        {healthy ? (
          <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        ) : (
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        )}
        <div>
          <h2
            className={`text-sm font-semibold ${healthy ? "text-emerald-800" : "text-amber-900"}`}
          >
            {healthy
              ? "Sanctuary CMS is operational"
              : "Some services need attention"}
          </h2>
          {healthy ? (
            <p className="mt-1 text-xs text-emerald-700">
              Database connected · Email sending through {status.emailProvider}
            </p>
          ) : (
            <ul className="mt-1 space-y-0.5 text-xs text-amber-800">
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {status.email !== "ok" && (
        <Link
          href="/settings/integrations"
          className="inline-flex items-center gap-2 text-sm font-semibold text-amber-900 transition hover:text-amber-950"
        >
          Open Integrations
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </section>
  );
}

export default function SupportPage() {
  const [search, setSearch] = useState("");
  const [openGuide, setOpenGuide] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    getSystemStatus()
      .then(setStatus)
      .catch(() =>
        setStatus({
          database: false,
          email: "not_configured",
          emailProvider: null,
        })
      );
  }, []);

  const filteredGuides = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return guides;
    return guides.filter((g) =>
      `${g.title} ${g.keywords} ${g.steps.join(" ")}`.toLowerCase().includes(q)
    );
  }, [search]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    data.set("pageUrl", window.location.href);

    setSending(true);
    setError(null);
    const res = await submitSupportRequest(data);
    setSending(false);

    if (!res.ok) return setError(res.message);
    setSubmitted(true);
  }

  const field =
    "mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10";

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-10">
      <div className="mb-8">
        <p className="text-xs text-slate-400">Administration</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-gwc-navy">
          Help &amp; Support
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Find guidance for Sanctuary CMS or send a request to the support team.
        </p>
      </div>

      <section className="rounded-xl bg-gwc-navy px-6 py-8 text-white shadow-sm sm:px-10">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-gwc-gold">
            <HelpCircle className="h-5 w-5" />
            <span className="text-sm font-semibold">Help Center</span>
          </div>
          <h2 className="mt-3 text-2xl font-bold">
            How can we help you today?
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            Search the guides below for common tasks, or contact support if
            you&apos;re stuck.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              document
                .getElementById("guides")
                ?.scrollIntoView({ behavior: "smooth" });
              if (filteredGuides.length === 1)
                setOpenGuide(filteredGuides[0].title);
            }}
            className="mt-6 flex flex-col gap-3 sm:flex-row"
          >
            <label className="relative block flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search newsletters, members, settings, privacy..."
                className="w-full rounded-md border border-white/10 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-gwc-gold"
              />
            </label>
            <button
              type="submit"
              className="rounded-md bg-gwc-gold px-5 py-3 text-sm font-semibold text-gwc-gold-text transition hover:brightness-95"
            >
              Search Help
            </button>
          </form>
        </div>
      </section>

      <section className="mt-7">
        <h2 className="text-base font-semibold text-slate-800">
          Quick actions
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Go directly to the CMS area you need.
        </p>
        <div className="mt-4 grid gap-5 md:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-gwc-gold/50 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-gwc-navy">
                    <Icon className="h-5 w-5" />
                  </span>
                  <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-gwc-gold" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-slate-800">
                  {action.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {action.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-7 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        <div
          id="guides"
          className="scroll-mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-gwc-navy">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                {search ? `Guides matching "${search}"` : "Popular guides"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Helpful starting points for church administrators.
              </p>
            </div>
          </div>

          <div className="mt-5 divide-y divide-slate-100">
            {filteredGuides.length === 0 && (
              <p className="py-6 text-sm text-slate-500">
                No guides match your search. Try another word, or contact
                support.
              </p>
            )}
            {filteredGuides.map((guide) => {
              const open = openGuide === guide.title;
              return (
                <div key={guide.title}>
                  <button
                    type="button"
                    onClick={() => setOpenGuide(open ? null : guide.title)}
                    aria-expanded={open}
                    className="flex w-full items-center justify-between gap-4 py-4 text-left transition hover:text-gwc-navy"
                  >
                    <span className="flex items-center gap-3">
                      <FileText className="h-4 w-4 shrink-0 text-gwc-gold" />
                      <span className="text-sm font-medium text-slate-700">
                        {guide.title}
                      </span>
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
                    />
                  </button>
                  {open && (
                    <div className="pb-5 pl-7">
                      <ol className="list-decimal space-y-1.5 pl-4 text-sm leading-6 text-slate-600">
                        {guide.steps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                      <Link
                        href={guide.href}
                        className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gwc-navy hover:text-gwc-gold"
                      >
                        {guide.linkLabel}
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gwc-navy text-white">
              <LifeBuoy className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Contact support
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Send the support team a detailed request.
              </p>
            </div>
          </div>

          {submitted ? (
            <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex gap-3">
                <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-semibold text-emerald-800">
                    Your request was sent
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-emerald-700">
                    Support will reply to your account email address.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-3 text-sm font-semibold text-emerald-800 hover:underline"
                  >
                    Send another request
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && (
                <p
                  role="alert"
                  className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                  {error}
                </p>
              )}
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">
                  Subject
                </span>
                <input
                  required
                  name="subject"
                  maxLength={150}
                  placeholder="What do you need help with?"
                  className={field}
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">
                  Category
                </span>
                <select
                  required
                  name="category"
                  defaultValue=""
                  className={field}
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">
                  Description
                </span>
                <textarea
                  required
                  name="description"
                  rows={5}
                  minLength={10}
                  maxLength={5000}
                  placeholder="Describe what happened, what you expected, and any steps that led to the issue."
                  className={`${field} resize-y`}
                />
              </label>
              <p className="text-xs leading-5 text-slate-400">
                Do not include sensitive member data, passwords, or payment
                details in a support request.
              </p>
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center gap-2 rounded-md bg-gwc-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                {sending ? "Sending…" : "Submit Support Request"}
              </button>
            </form>
          )}
        </div>
      </section>

      <StatusBar status={status} />
    </main>
  );
}
