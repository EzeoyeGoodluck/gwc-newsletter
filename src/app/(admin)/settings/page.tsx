import Link from "next/link";
import {
  Bell,
  Building2,
  ChevronRight,
  KeyRound,
  Palette,
  Plug,
  ShieldCheck,
  Users,
} from "lucide-react";

const settingsSections = [
  {
    title: "Organization Profile",
    description:
      "Update church details, contact information, addresses, and regional preferences.",
    href: "/settings/organization",
    icon: Building2,
  },
  {
    title: "Branding & Appearance",
    description:
      "Manage your logo, colors, email footer, and newsletter presentation.",
    href: "/settings/branding",
    icon: Palette,
  },
  {
    title: "Team & Permissions",
    description:
      "Invite administrators, manage roles, and control access to CMS tools.",
    href: "/settings/users",
    icon: Users,
  },
  {
    title: "Communication Defaults",
    description:
      "Set sender details, reply-to addresses, notification preferences, and delivery defaults.",
    href: "/settings/notifications",
    icon: Bell,
  },
  {
    title: "Integrations",
    description:
      "Connect email services, church systems, reporting tools, and other services.",
    href: "/settings/integrations",
    icon: Plug,
  },
  {
    title: "Security & Privacy",
    description:
      "Review account protection, access sessions, data policy, and privacy controls.",
    href: "/settings/security",
    icon: ShieldCheck,
  },
];

export default function SettingsPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-10">
      <div className="mb-8">
        <p className="text-xs text-slate-400">Administration</p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-gwc-navy">
          Settings
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage your organization, brand, team access, communications, and
          account security.
        </p>
      </div>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {settingsSections.map((section) => {
          const Icon = section.icon;

          return (
            <Link
              key={section.title}
              href={section.href}
              className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-gwc-gold/50 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-gwc-navy text-white">
                  <Icon className="h-5 w-5" />
                </span>

                <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-gwc-gold" />
              </div>

              <h2 className="mt-5 text-base font-semibold text-slate-800">
                {section.title}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {section.description}
              </p>
            </Link>
          );
        })}
      </section>

      <section className="mt-7 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-gwc-navy">
              <KeyRound className="h-5 w-5" />
            </span>

            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Account security status
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review active sessions, strengthen sign-in security, and manage
                administrator access.
              </p>
            </div>
          </div>

          <Link
            href="/settings/security"
            className="inline-flex shrink-0 items-center justify-center rounded-md bg-gwc-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Review Security
          </Link>
        </div>
      </section>
    </main>
  );
}
