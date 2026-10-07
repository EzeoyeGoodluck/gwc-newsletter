// import { ShieldCheck, Users, MailPlus } from "lucide-react";
// import { prisma } from "@/lib/prisma";
// import { requirePermission } from "@/lib/session";
// import { ROLE_LABELS, assignableRoles, canManageRole } from "@/lib/permissions";
// import { InviteForm, MemberActions, InvitationActions } from "./team-client";

// import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
// import {
//   getTeam,
//   changeMemberRole,
//   removeTeamMember,
//   createInvitation,
//   cancelInvitation as cancelInvitationAction,
//   TeamMemberDTO,
//   InvitationDTO,
// } from "./actions";
// import type { RoleLabel } from "@/lib/roles";

// const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

// export default async function TeamPage() {
//   const actor = await requirePermission("team.manage");
//   const roles = assignableRoles(actor.role);

//   const [members, invitations] = await Promise.all([
//     prisma.user.findMany({
//       orderBy: { createdAt: "asc" },
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         role: true,
//         createdAt: true,
//       },
//     }),
//     prisma.invitation.findMany({
//       where: { status: "PENDING" },
//       orderBy: { createdAt: "desc" },
//     }),
//   ]);

//   const now = new Date();

//   return (
//     <div className="mx-auto max-w-5xl space-y-8">
//       <div>
//         <h1 className="text-2xl font-bold tracking-tight text-slate-900">
//           Team
//         </h1>
//         <p className="mt-1 text-sm text-slate-500">
//           Invite staff and control what each person can access.
//         </p>
//       </div>

//       <section className="rounded-xl border border-slate-200 bg-white p-6">
//         <div className="flex items-center gap-2">
//           <MailPlus className="h-5 w-5 text-gwc-navy" aria-hidden="true" />
//           <h2 className="text-base font-semibold text-slate-900">
//             Invite someone
//           </h2>
//         </div>
//         <p className="mt-1 mb-4 text-sm text-slate-500">
//           They will get a link to create their account. Links expire after 7
//           days.
//         </p>
//         <InviteForm roles={roles} />
//       </section>

//       <section className="rounded-xl border border-slate-200 bg-white">
//         <div className="flex items-center gap-2 border-b border-slate-100 p-6">
//           <Users className="h-5 w-5 text-gwc-navy" aria-hidden="true" />
//           <h2 className="text-base font-semibold text-slate-900">
//             Staff ({members.length})
//           </h2>
//         </div>
//         <ul className="divide-y divide-slate-100">
//           {members.map((m) => {
//             const isSelf = m.id === actor.id;
//             const manageable = !isSelf && canManageRole(actor.role, m.role);
//             return (
//               <li
//                 key={m.id}
//                 className="flex flex-wrap items-center justify-between gap-4 px-6 py-4"
//               >
//                 <div>
//                   <p className="text-sm font-semibold text-slate-900">
//                     {m.name}{" "}
//                     {isSelf && (
//                       <span className="font-normal text-slate-400">(you)</span>
//                     )}
//                   </p>
//                   <p className="text-sm text-slate-500">{m.email}</p>
//                   <p className="mt-0.5 text-xs text-slate-400">
//                     Joined {dateFormat.format(m.createdAt)}
//                   </p>
//                 </div>
//                 {manageable ? (
//                   <MemberActions
//                     userId={m.id}
//                     name={m.name}
//                     role={m.role}
//                     roles={roles}
//                   />
//                 ) : (
//                   <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
//                     {m.role === "OWNER" && (
//                       <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
//                     )}
//                     {ROLE_LABELS[m.role] ?? m.role}
//                   </span>
//                 )}
//               </li>
//             );
//           })}
//         </ul>
//       </section>

//       <section className="rounded-xl border border-slate-200 bg-white">
//         <div className="border-b border-slate-100 p-6">
//           <h2 className="text-base font-semibold text-slate-900">
//             Pending invitations ({invitations.length})
//           </h2>
//         </div>
//         {invitations.length === 0 ? (
//           <p className="px-6 py-8 text-center text-sm text-slate-500">
//             No pending invitations.
//           </p>
//         ) : (
//           <ul className="divide-y divide-slate-100">
//             {invitations.map((inv) => {
//               const expired = inv.expiresAt < now;
//               const manageable = canManageRole(actor.role, inv.role);
//               return (
//                 <li
//                   key={inv.id}
//                   className="flex flex-wrap items-start justify-between gap-4 px-6 py-4"
//                 >
//                   <div>
//                     <p className="text-sm font-semibold text-slate-900">
//                       {inv.email}
//                     </p>
//                     <p className="text-sm text-slate-500">
//                       {ROLE_LABELS[inv.role] ?? inv.role} ·{" "}
//                       {expired ? (
//                         <span className="font-semibold text-amber-600">
//                           Expired
//                         </span>
//                       ) : (
//                         <>Expires {dateFormat.format(inv.expiresAt)}</>
//                       )}
//                     </p>
//                   </div>
//                   {manageable && (
//                     <InvitationActions
//                       invitationId={inv.id}
//                       email={inv.email}
//                     />
//                   )}
//                 </li>
//               );
//             })}
//           </ul>
//         )}
//       </section>
//     </div>
//   );
// }

export default function TeamPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Team</h1>
      <p className="mt-2 text-sm text-gray-600">
        Team management is being configured.
      </p>
    </main>
  );
}
