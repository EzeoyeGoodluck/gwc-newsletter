"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  Copy,
  Mail,
  MoreHorizontal,
  Plus,
  UserCog,
  Users,
  X,
} from "lucide-react";
import {
  getTeam,
  changeMemberRole,
  removeTeamMember,
  createInvitation,
  cancelInvitation as cancelInvitationAction,
  TeamMemberDTO,
  InvitationDTO,
} from "./actions";
import { canManageRole, assignableRoles } from "@/lib/permissions";
import { LABEL_TO_ROLE, ROLE_TO_LABEL, RoleLabel } from "@/lib/roles";

type Role = RoleLabel;
type InviteRole = Exclude<Role, "Owner">;

const ALL_ROLES: Role[] = ["Owner", "Administrator", "Editor", "Viewer"];

const roleDescriptions: Record<Role, string> = {
  Owner:
    "Full account access, including organization controls, security, privacy, and team management.",
  Administrator:
    "Manage members, newsletters, templates, settings, and day-to-day CMS operations.",
  Editor:
    "Create and edit newsletters and templates without access to security or organization controls.",
  Viewer: "Read-only access to permitted CMS areas and reporting.",
};

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

function formatWhen(iso: string | null) {
  if (!iso) return "Never signed in";
  const d = new Date(iso);
  const diffMin = (Date.now() - d.getTime()) / 60_000;
  if (diffMin < 5) return "Active now";
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const yesterday = new Date(Date.now() - 86_400_000);
  if (d.toDateString() === new Date().toDateString()) return `Today, ${time}`;
  if (d.toDateString() === yesterday.toDateString())
    return `Yesterday, ${time}`;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
      className={`inline-flex w-[124px] items-center justify-center whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${styles[role]}`}
    >
      {role}
    </span>
  );
}

export default function TeamPermissionsPage() {
  const [members, setMembers] = useState<TeamMemberDTO[]>([]);
  const [invitations, setInvitations] = useState<InvitationDTO[]>([]);
  const [currentRole, setCurrentRole] = useState<Role>("Viewer");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InviteRole>("Editor");
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  const myRole = LABEL_TO_ROLE[currentRole];
  const inviteOptions = useMemo(
    () => assignableRoles(myRole).map((r) => ROLE_TO_LABEL[r]) as InviteRole[],
    [myRole]
  );
  const canInvite = inviteOptions.length > 0;
  const canManageMember = (m: TeamMemberDTO) =>
    !m.isYou && canManageRole(myRole, LABEL_TO_ROLE[m.role]);

  const load = useCallback(async () => {
    const res = await getTeam();
    setLoading(false);
    if (!res.ok) return setError(res.message);
    setMembers(res.data.members);
    setInvitations(res.data.invitations);
    setCurrentRole(res.data.currentRole);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (inviteOptions.length && !inviteOptions.includes(inviteRole)) {
      setInviteRole(inviteOptions[inviteOptions.length - 1]);
    }
  }, [inviteOptions, inviteRole]);

  const roleCounts = useMemo(
    () =>
      members.reduce<Record<Role, number>>(
        (counts, m) => ({ ...counts, [m.role]: counts[m.role] + 1 }),
        { Owner: 0, Administrator: 0, Editor: 0, Viewer: 0 }
      ),
    [members]
  );

  function report(res: { ok: boolean; message?: string }, success: string) {
    if (res.ok) {
      setError(null);
      setNotice(success);
    } else {
      setNotice(null);
      setError(res.message ?? "Something went wrong.");
    }
  }

  async function updateMemberRole(id: string, role: Role) {
    const target = members.find((m) => m.id === id);
    setActiveMenuId(null);
    setBusy(true);
    const res = await changeMemberRole(id, role);
    setBusy(false);
    report(
      res,
      `${target?.name ?? "Team member"} is now ${role === "Administrator" ? "an" : "a"} ${role}.`
    );
    if (res.ok) load();
  }

  async function removeMember(id: string) {
    const target = members.find((m) => m.id === id);
    setActiveMenuId(null);
    if (
      !confirm(
        `Remove ${target?.name ?? "this person"}'s access? They will be signed out immediately.`
      )
    )
      return;
    setBusy(true);
    const res = await removeTeamMember(id);
    setBusy(false);
    report(res, `${target?.name ?? "Team member"} no longer has access.`);
    if (res.ok) load();
  }

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const res = await createInvitation(inviteEmail, inviteRole);
    setBusy(false);
    if (!res.ok) return setError(res.message);

    setError(null);
    setLastInviteLink(res.data.link);
    setInviteEmail("");
    setIsInviteOpen(false);
    setNotice(
      "Invitation created. Copy the link below and send it to them. It expires in 7 days."
    );
    load();
  }

  async function cancelInvitation(id: string) {
    const target = invitations.find((i) => i.id === id);
    if (!confirm(`Cancel the invitation for ${target?.email}?`)) return;
    const res = await cancelInvitationAction(id);
    report(
      res,
      `Invitation for ${target?.email ?? "team member"} was cancelled.`
    );
    if (res.ok) {
      if (lastInviteLink === target?.link) setLastInviteLink(null);
      load();
    }
  }

  async function copyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setNotice("Invite link copied to clipboard.");
    } catch {
      setError(
        "Couldn't copy automatically. Select the link and copy it manually."
      );
    }
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
            disabled={!canInvite || loading}
            onClick={() => {
              setIsInviteOpen(true);
              setNotice(null);
              setError(null);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-gwc-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Invite Team Member
          </button>
        </div>
      </header>

      {error && !isInviteOpen && (
        <div
          role="alert"
          className="mb-6 flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <div className="flex items-start gap-3">
            <CircleAlert
              className="mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            />
            <p className="leading-6">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="rounded p-1 hover:bg-red-100"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

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
            className="rounded p-1 text-emerald-700 hover:bg-emerald-100"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {lastInviteLink && (
        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm sm:flex-row sm:items-center">
          <code className="flex-1 truncate rounded bg-slate-50 px-2 py-1.5 text-xs text-slate-700">
            {lastInviteLink}
          </code>
          <button
            type="button"
            onClick={() => copyLink(lastInviteLink)}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-gwc-navy px-3 py-1.5 text-xs font-semibold text-white"
          >
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            Copy link
          </button>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ALL_ROLES.map((role) => (
          <div
            key={role}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm font-semibold text-slate-700">
                {role}
              </span>
              <span className="text-2xl font-bold text-gwc-navy">
                {loading ? "–" : roleCounts[role]}
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              {roleDescriptions[role]}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start gap-3 border-b border-slate-100 px-6 py-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-gwc-navy">
            <Users className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              Active team members
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Loading team…"
                : `${members.length} ${members.length === 1 ? "person has" : "people have"} access to this organization.`}
            </p>
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
              {members.map((member) => {
                const manageable = canManageMember(member);
                return (
                  <tr key={member.id} className="text-sm text-slate-600">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gwc-navy text-xs font-bold text-white">
                          {getInitials(member.name)}
                        </span>
                        <span>
                          <span className="block font-semibold text-slate-800">
                            {member.name}
                            {member.isYou && (
                              <span className="ml-2 text-xs font-normal text-slate-400">
                                (you)
                              </span>
                            )}
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
                        Active
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500">
                      {formatWhen(member.lastActive)}
                    </td>
                    <td className="relative px-6 py-4 text-right">
                      <button
                        type="button"
                        disabled={!manageable || busy}
                        onClick={() =>
                          setActiveMenuId((cur) =>
                            cur === member.id ? null : member.id
                          )
                        }
                        className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-gwc-navy disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label={`Manage ${member.name}`}
                        aria-expanded={activeMenuId === member.id}
                      >
                        <MoreHorizontal
                          className="h-5 w-5"
                          aria-hidden="true"
                        />
                      </button>

                      {activeMenuId === member.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setActiveMenuId(null)}
                          />
                          <div className="absolute right-6 z-20 mt-1 w-52 rounded-lg border border-slate-200 bg-white p-1 text-left shadow-lg">
                            <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Change role
                            </p>
                            {ALL_ROLES.map((role) => (
                              <button
                                key={role}
                                type="button"
                                disabled={
                                  busy ||
                                  member.role === role ||
                                  !canManageRole(myRole, LABEL_TO_ROLE[role])
                                }
                                onClick={() =>
                                  updateMemberRole(member.id, role)
                                }
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
                            ))}
                            <div className="my-1 border-t border-slate-100" />
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => removeMember(member.id)}
                              className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-40"
                            >
                              Remove access
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
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
              Invitations stay pending until the person accepts, or until they
              expire after 7 days.
            </p>
          </div>
        </div>

        {invitations.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {invitations.map((inv) => {
              const manageable = canManageRole(myRole, LABEL_TO_ROLE[inv.role]);
              return (
                <div
                  key={inv.id}
                  className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-gwc-navy">
                      {getInitials(
                        inv.email.split("@")[0].replace(/[._-]/g, " ")
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {inv.email}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Invited by {inv.invitedBy} · {formatWhen(inv.sentAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:justify-end">
                    <RoleBadge role={inv.role} />
                    {manageable && (
                      <>
                        <button
                          type="button"
                          onClick={() => copyLink(inv.link)}
                          className="text-sm font-semibold text-gwc-navy hover:underline"
                        >
                          Copy link
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelInvitation(inv.id)}
                          className="text-sm font-semibold text-red-700 transition hover:text-red-900"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
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
            {ALL_ROLES.map((role) => (
              <div
                key={role}
                className="grid gap-2 sm:grid-cols-[132px_minmax(0,1fr)] sm:items-start sm:gap-4"
              >
                <div className="pt-0.5">
                  <RoleBadge role={role} />
                </div>
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
                Access rules
              </h2>
              <ul className="mt-2 space-y-1.5 text-sm leading-6 text-amber-800">
                <li>Owners can manage Administrators, Editors, and Viewers.</li>
                <li>Administrators can manage Editors and Viewers only.</li>
                <li>
                  Owner access can&apos;t be changed or removed from this page.
                </li>
                <li>You can&apos;t change your own role or remove yourself.</li>
                <li>Every change is recorded in the audit log.</li>
              </ul>
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
                  Create an invite link and choose their level of access.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsInviteOpen(false);
                  setError(null);
                }}
                className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close invite dialog"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-5 px-6 py-6">
              {error && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">
                  Email address
                </span>
                <input
                  required
                  autoFocus
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
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
                    onChange={(e) =>
                      setInviteRole(e.target.value as InviteRole)
                    }
                    className="w-full appearance-none rounded-md border border-slate-200 bg-white px-3 py-2.5 pr-10 text-sm text-slate-800 outline-none focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
                  >
                    {inviteOptions.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
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
                An invite link will be created for you to send. Automatic invite
                emails will be added once email sending is set up.
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsInviteOpen(false);
                    setError(null);
                  }}
                  className="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-gwc-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  {busy ? "Creating…" : "Create Invite Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
