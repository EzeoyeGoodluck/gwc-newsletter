"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  Mail,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  UserCog,
  Users,
  X,
} from "lucide-react";

type Role = "Owner" | "Administrator" | "Editor" | "Viewer";
type TeamMember = {
  id: number;
  initials: string;
  name: string;
  email: string;
  role: Role;
  lastActive: string;
  status: "Active";
};
type Invitation = {
  id: number;
  initials: string;
  email: string;
  role: Exclude<Role, "Owner">;
  invitedBy: string;
  sentAt: string;
};

const roleDescriptions: Record<Role, string> = {
  Owner:
    "Full account access, including organization controls, security, privacy, and team management.",
  Administrator:
    "Manage members, newsletters, templates, settings, and day-to-day CMS operations.",
  Editor:
    "Create and edit newsletters and templates without access to security or organization controls.",
  Viewer: "Read-only access to permitted CMS areas and reporting.",
};

const initialMembers: TeamMember[] = [
  {
    id: 1,
    initials: "AR",
    name: "Admin Robert",
    email: "admin@gloryworshipchurch.org",
    role: "Owner",
    lastActive: "Active now",
    status: "Active",
  },
  {
    id: 2,
    initials: "MJ",
    name: "Martha Jenkins",
    email: "martha.jenkins@gloryworshipchurch.org",
    role: "Administrator",
    lastActive: "Today, 10:42 AM",
    status: "Active",
  },
  {
    id: 3,
    initials: "JW",
    name: "James Williams",
    email: "james.williams@gloryworshipchurch.org",
    role: "Editor",
    lastActive: "Yesterday, 3:16 PM",
    status: "Active",
  },
  {
    id: 4,
    initials: "SD",
    name: "Sarah Davis",
    email: "sarah.davis@gloryworshipchurch.org",
    role: "Viewer",
    lastActive: "Sep 18, 2026",
    status: "Active",
  },
];

const initialInvitations: Invitation[] = [
  {
    id: 101,
    initials: "DM",
    email: "david.miller@gloryworshipchurch.org",
    role: "Editor",
    invitedBy: "Admin Robert",
    sentAt: "Today, 9:30 AM",
  },
];

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "TM"
  );
}

function RoleBadge({ role }: { role: Role }) {
  const styles: Record<Role, string> = {
    Owner: "bg-gwc-navy/10 text-gwc-navy",
    Administrator: "bg-violet-50 text-violet-700",
    Editor: "bg-sky-50 text-sky-700",
    Viewer: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[role]}`}
    >
      {role}
    </span>
  );
}

export default function TeamPermissionsPage() {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [invitations, setInvitations] =
    useState<Invitation[]>(initialInvitations);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] =
    useState<Exclude<Role, "Owner">>("Editor");

  const roleCounts = useMemo(
    () =>
      members.reduce<Record<Role, number>>(
        (counts, member) => ({
          ...counts,
          [member.role]: counts[member.role] + 1,
        }),
        { Owner: 0, Administrator: 0, Editor: 0, Viewer: 0 }
      ),
    [members]
  );

  function updateMemberRole(id: number, role: Role) {
    const target = members.find((member) => member.id === id);

    if (target?.role === "Owner") {
      setNotice("Owner access cannot be changed in this UI preview.");
      setActiveMenuId(null);
      return;
    }

    setMembers((current) =>
      current.map((member) => (member.id === id ? { ...member, role } : member))
    );
    setActiveMenuId(null);
    setNotice(
      `${target?.name ?? "Team member"} is now assigned the ${role} role in this UI preview.`
    );
  }

  function removeMember(id: number) {
    const target = members.find((member) => member.id === id);

    if (target?.role === "Owner") {
      setNotice("The account owner cannot be removed in this UI preview.");
      setActiveMenuId(null);
      return;
    }

    setMembers((current) => current.filter((member) => member.id !== id));
    setActiveMenuId(null);
    setNotice(
      `${target?.name ?? "Team member"} was removed from this UI preview.`
    );
  }

  function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;

    if (members.some((member) => member.email.toLowerCase() === email)) {
      setNotice("That email already belongs to an active team member.");
      return;
    }

    if (
      invitations.some((invitation) => invitation.email.toLowerCase() === email)
    ) {
      setNotice("An invitation for that email is already pending.");
      return;
    }

    setInvitations((current) => [
      {
        id: Date.now(),
        initials: getInitials(email.split("@")[0].replace(/[._-]/g, " ")),
        email,
        role: inviteRole,
        invitedBy: "Admin Robert",
        sentAt: "Just now",
      },
      ...current,
    ]);
    setInviteEmail("");
    setInviteRole("Editor");
    setIsInviteOpen(false);
    setNotice(
      `Invitation prepared for ${email}. Connect an invitation API to send the actual email.`
    );
  }

  function cancelInvitation(id: number) {
    const target = invitations.find((invitation) => invitation.id === id);
    setInvitations((current) =>
      current.filter((invitation) => invitation.id !== id)
    );
    setNotice(
      `Invitation for ${target?.email ?? "team member"} was cancelled in this UI preview.`
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-10">
      <header className="mb-8">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-gwc-navy"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Settings
        </Link>

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs text-slate-400">Settings</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-gwc-navy">
              Team &amp; Permissions
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Manage who can access your CMS and what they are allowed to do.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsInviteOpen(true);
              setNotice(null);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-gwc-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-gwc-navy focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Invite Team Member
          </button>
        </div>
      </header>

      {notice && (
        <div
          role="status"
          className="mb-6 flex items-start justify-between gap-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2
              className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
              aria-hidden="true"
            />
            <p className="leading-6">{notice}</p>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="rounded p-1 text-emerald-700 transition hover:bg-emerald-100"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(roleDescriptions) as Role[]).map((role) => (
          <div
            key={role}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-semibold text-slate-700">
                {role}
              </span>
              <span className="text-2xl font-bold text-gwc-navy">
                {roleCounts[role]}
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              {roleDescriptions[role]}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-gwc-navy">
              <Users className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Active team members
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {members.length}{" "}
                {members.length === 1 ? "person has" : "people have"} access to
                this organization.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3 font-medium">Team member</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last active</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((member) => (
                <tr key={member.id} className="text-sm text-slate-600">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gwc-navy text-xs font-bold text-white">
                        {member.initials}
                      </span>
                      <span>
                        <span className="block font-semibold text-slate-800">
                          {member.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-500">
                          {member.email}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <RoleBadge role={member.role} />
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {member.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-500">
                    {member.lastActive}
                  </td>
                  <td className="relative px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        setActiveMenuId((current) =>
                          current === member.id ? null : member.id
                        )
                      }
                      className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-gwc-navy focus:outline-none focus:ring-2 focus:ring-gwc-navy/20"
                      aria-label={`Manage ${member.name}`}
                      aria-expanded={activeMenuId === member.id}
                    >
                      <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
                    </button>

                    {activeMenuId === member.id && (
                      <div className="absolute right-6 z-10 mt-1 w-52 rounded-lg border border-slate-200 bg-white p-1 text-left shadow-lg">
                        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Change role
                        </p>
                        {(Object.keys(roleDescriptions) as Role[]).map(
                          (role) => (
                            <button
                              key={role}
                              type="button"
                              disabled={
                                member.role === role || member.role === "Owner"
                              }
                              onClick={() => updateMemberRole(member.id, role)}
                              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {role}
                              {member.role === role && (
                                <CheckCircle2
                                  className="h-4 w-4 text-gwc-navy"
                                  aria-hidden="true"
                                />
                              )}
                            </button>
                          )
                        )}
                        <div className="my-1 border-t border-slate-100" />
                        <button
                          type="button"
                          disabled={member.role === "Owner"}
                          onClick={() => removeMember(member.id)}
                          className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Remove access
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start gap-3 border-b border-slate-100 px-6 py-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-gwc-navy">
            <Clock3 className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              Pending invitations
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Invitations remain pending until a recipient accepts and activates
              their account.
            </p>
          </div>
        </div>

        {invitations.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-gwc-navy">
                    {invitation.initials}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {invitation.email}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Invited by {invitation.invitedBy} · {invitation.sentAt}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:justify-end">
                  <RoleBadge role={invitation.role} />
                  <button
                    type="button"
                    onClick={() => cancelInvitation(invitation.id)}
                    className="text-sm font-semibold text-red-700 transition hover:text-red-900"
                  >
                    Cancel invitation
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-10 text-center">
            <Mail
              className="mx-auto h-8 w-8 text-slate-300"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm font-semibold text-slate-700">
              No pending invitations
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Invite a teammate when they need access to the CMS.
            </p>
          </div>
        )}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-gwc-navy">
              <UserCog className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-800">
                Role guidance
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Give people the least access needed for their work.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {(Object.keys(roleDescriptions) as Role[]).map((role) => (
              <div key={role} className="flex gap-3">
                <RoleBadge role={role} />
                <p className="text-sm leading-6 text-slate-500">
                  {roleDescriptions[role]}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex gap-3">
            <CircleAlert
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-700"
              aria-hidden="true"
            />
            <div>
              <h2 className="text-base font-semibold text-amber-900">
                UI preview only
              </h2>
              <p className="mt-1 text-sm leading-6 text-amber-800">
                Role changes, invitations, and access removal currently affect
                only this screen. Connect your authentication, invitation, and
                authorization backend before treating these actions as real
                account controls.
              </p>
            </div>
          </div>
        </div>
      </section>

      {isInviteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-dialog-title"
        >
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <h2
                  id="invite-dialog-title"
                  className="text-lg font-semibold text-slate-800"
                >
                  Invite team member
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Prepare an invitation and assign the right level of access.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteOpen(false)}
                className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close invite dialog"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-5 px-6 py-6">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Email address
                </span>
                <input
                  required
                  autoFocus
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="teammate@example.org"
                  className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Role
                </span>
                <span className="relative mt-2 block">
                  <select
                    value={inviteRole}
                    onChange={(event) =>
                      setInviteRole(
                        event.target.value as Exclude<Role, "Owner">
                      )
                    }
                    className="w-full appearance-none rounded-md border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm text-slate-800 outline-none focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Editor">Editor</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                </span>
                <span className="mt-2 block text-xs leading-5 text-slate-400">
                  {roleDescriptions[inviteRole]}
                </span>
              </label>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                This is a UI-only workflow. No invitation email will be sent
                until an authentication and invitation backend is connected.
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-gwc-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  Prepare Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
