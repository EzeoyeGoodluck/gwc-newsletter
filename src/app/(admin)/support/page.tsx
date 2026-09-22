"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  CircleCheck,
  FileText,
  HelpCircle,
  LifeBuoy,
  Mail,
  Search,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react";

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

const guides = [
  "How to create and send a newsletter",
  "How to add or import members",
  "How to edit templates and apply branding",
  "How to manage team roles and permissions",
  "How to manage consent and GDPR requests",
];

export default function SupportPage() {
  const [search, setSearch] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Replace this with a real support-ticket API request later.
    setSubmitted(true);
  }

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
            Search guides for common tasks, review product documentation, or
            contact the Sanctuary CMS support team.
          </p>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              // Connect this to help-center search results later.
            }}
            className="mt-6 flex flex-col gap-3 sm:flex-row"
          >
            <label className="relative block flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
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
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-gwc-navy">
              <BookOpen className="h-5 w-5" />
            </span>

            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Popular guides
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Helpful starting points for church administrators.
              </p>
            </div>
          </div>

          <div className="mt-5 divide-y divide-slate-100">
            {guides.map((guide) => (
              <button
                key={guide}
                type="button"
                className="flex w-full items-center justify-between gap-4 py-4 text-left transition hover:text-gwc-navy"
              >
                <span className="flex items-center gap-3">
                  <FileText className="h-4 w-4 shrink-0 text-gwc-gold" />
                  <span className="text-sm font-medium text-slate-700">
                    {guide}
                  </span>
                </span>

                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
              </button>
            ))}
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
                    Your request is ready to be sent
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-emerald-700">
                    Connect this form to your support-ticket API to create and
                    track real support requests.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-xs font-semibold text-slate-700">
                  Subject
                </span>
                <input
                  required
                  placeholder="What do you need help with?"
                  className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700">
                  Category
                </span>
                <select
                  defaultValue=""
                  required
                  className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  <option>Newsletters &amp; Templates</option>
                  <option>Members &amp; Directory</option>
                  <option>Settings &amp; Access</option>
                  <option>Privacy &amp; GDPR</option>
                  <option>Technical issue</option>
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-slate-700">
                  Description
                </span>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe what happened, what you expected, and any steps that led to the issue."
                  className="mt-2 w-full resize-y rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
                />
              </label>

              <p className="text-xs leading-5 text-slate-400">
                Do not include sensitive member data, passwords, or payment
                details in a support request.
              </p>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md bg-gwc-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <Mail className="h-4 w-4" />
                Submit Support Request
              </button>
            </form>
          )}
        </div>
      </section>

      <section className="mt-7 flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <CircleCheck className="h-5 w-5 shrink-0 text-emerald-600" />

          <div>
            <h2 className="text-sm font-semibold text-emerald-800">
              Sanctuary CMS is operational
            </h2>
            <p className="mt-1 text-xs text-emerald-700">
              No known service disruptions are currently affecting the CMS.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-950"
        >
          View system status
          <ChevronRight className="h-4 w-4" />
        </button>
      </section>
    </main>
  );
}
