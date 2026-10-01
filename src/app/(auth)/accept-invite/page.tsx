import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ROLE_LABELS } from "@/lib/permissions";
import { AcceptInviteForm } from "./accept-invite-form";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  const [invitation, settings] = await Promise.all([
    token ? prisma.invitation.findUnique({ where: { token } }) : null,
    prisma.churchSettings.findUnique({ where: { id: "default" } }),
  ]);

  const churchName = settings?.name ?? "Glory Worship Church";

  let problem: string | null = null;
  if (!token || !invitation || invitation.status === "CANCELLED") {
    problem = "This invitation link is invalid or has been cancelled.";
  } else if (invitation.status === "ACCEPTED") {
    problem =
      "This invitation has already been used. You can sign in with your account.";
  } else if (invitation.expiresAt < new Date()) {
    problem =
      "This invitation has expired. Ask your church administrator to send a new one.";
  }

  if (problem || !invitation || !token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {churchName}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-gwc-navy">
            Invitation unavailable
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">{problem}</p>
          <Link
            href="/login"
            className="mt-6 inline-flex rounded-md bg-gwc-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Go to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <AcceptInviteForm
      token={token}
      email={invitation.email}
      roleLabel={ROLE_LABELS[invitation.role] ?? invitation.role}
      churchName={churchName}
    />
  );
}
