import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { getValidInvitation, ROLE_LABELS } from "@/lib/invitations";
import { AcceptInviteForm } from "./accept-invite-form";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const invitation = await getValidInvitation(token);

  if (!invitation) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <ShieldAlert
            className="mx-auto h-10 w-10 text-amber-500"
            aria-hidden="true"
          />
          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Invitation not valid
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            This invitation link is invalid, expired, or has already been used.
            Ask your church administrator to send you a new invitation.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-sm font-semibold text-gwc-navy hover:opacity-75"
          >
            Go to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <AcceptInviteForm
      token={invitation.token}
      email={invitation.email}
      roleLabel={ROLE_LABELS[invitation.role] ?? invitation.role}
      churchName="Glory Worship Church"
    />
  );
}
