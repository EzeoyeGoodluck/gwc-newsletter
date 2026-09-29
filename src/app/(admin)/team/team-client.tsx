// "use client";

// import { FormEvent, useState, useTransition } from "react";
// import { Check, Copy, RefreshCw, Trash2, UserPlus, X } from "lucide-react";
// import { ROLE_LABELS, type Role } from "@/lib/permissions";
// import {
//   inviteMember,
//   resendInvitation,
//   revokeInvitation,
//   changeMemberRole,
//   removeMember,
//   type ActionResult,
// } from "./actions";

// function Notice({ result }: { result: ActionResult | null }) {
//   if (!result) return null;
//   return (
//     <div
//       role={result.ok ? "status" : "alert"}
//       className={`mt-4 rounded-lg border px-4 py-3 text-sm leading-6 ${
//         result.ok
//           ? "border-emerald-200 bg-emerald-50 text-emerald-800"
//           : "border-amber-200 bg-amber-50 text-amber-800"
//       }`}
//     >
//       {result.message}
//       {result.ok && result.inviteUrl && <CopyLink url={result.inviteUrl} />}
//     </div>
//   );
// }

// function CopyLink({ url }: { url: string }) {
//   const [copied, setCopied] = useState(false);
//   return (
//     <div className="mt-3 flex items-center gap-2">
//       <input
//         readOnly
//         value={url}
//         className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"
//       />
//       <button
//         type="button"
//         onClick={async () => {
//           await navigator.clipboard.writeText(url);
//           setCopied(true);
//           setTimeout(() => setCopied(false), 2000);
//         }}
//         className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-gwc-navy hover:bg-slate-50"
//       >
//         {copied ? (
//           <Check className="h-3.5 w-3.5" />
//         ) : (
//           <Copy className="h-3.5 w-3.5" />
//         )}
//         {copied ? "Copied" : "Copy"}
//       </button>
//     </div>
//   );
// }

// export function InviteForm({ roles }: { roles: Role[] }) {
//   const [result, setResult] = useState<ActionResult | null>(null);
//   const [isPending, startTransition] = useTransition();

//   function handleSubmit(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     const form = event.currentTarget;
//     const data = new FormData(form);
//     setResult(null);

//     startTransition(async () => {
//       const res = await inviteMember(data);
//       setResult(res);
//       if (res.ok) form.reset();
//     });
//   }

//   return (
//     <div>
//       <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
//         <input
//           required
//           name="email"
//           type="email"
//           placeholder="staff.member@church.org"
//           className="w-full rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
//         />
//         <select
//           name="role"
//           defaultValue={roles.includes("EDITOR") ? "EDITOR" : roles[0]}
//           className="rounded-md border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-gwc-navy"
//         >
//           {roles.map((r) => (
//             <option key={r} value={r}>
//               {ROLE_LABELS[r]}
//             </option>
//           ))}
//         </select>
//         <button
//           type="submit"
//           disabled={isPending}
//           className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-gwc-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
//         >
//           <UserPlus className="h-4 w-4" aria-hidden="true" />
//           {isPending ? "Sending…" : "Send invite"}
//         </button>
//       </form>
//       <Notice result={result} />
//     </div>
//   );
// }

// export function MemberActions({
//   userId,
//   name,
//   role,
//   roles,
// }: {
//   userId: string;
//   name: string;
//   role: string;
//   roles: Role[];
// }) {
//   const [result, setResult] = useState<ActionResult | null>(null);
//   const [isPending, startTransition] = useTransition();

//   return (
//     <div className="flex flex-col items-end gap-1">
//       <div className="flex items-center gap-2">
//         <select
//           defaultValue={role}
//           disabled={isPending}
//           onChange={(e) => {
//             const newRole = e.target.value;
//             startTransition(async () =>
//               setResult(await changeMemberRole(userId, newRole))
//             );
//           }}
//           className="rounded-md border border-slate-200 px-2 py-1.5 text-sm"
//         >
//           {roles.map((r) => (
//             <option key={r} value={r}>
//               {ROLE_LABELS[r]}
//             </option>
//           ))}
//         </select>
//         <button
//           type="button"
//           disabled={isPending}
//           onClick={() => {
//             if (!confirm(`Remove ${name}? They will lose access immediately.`))
//               return;
//             startTransition(async () => setResult(await removeMember(userId)));
//           }}
//           className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
//           aria-label={`Remove ${name}`}
//         >
//           <Trash2 className="h-4 w-4" />
//         </button>
//       </div>
//       {result && !result.ok && (
//         <p className="text-xs text-amber-700">{result.message}</p>
//       )}
//     </div>
//   );
// }

// export function InvitationActions({
//   invitationId,
//   email,
// }: {
//   invitationId: string;
//   email: string;
// }) {
//   const [result, setResult] = useState<ActionResult | null>(null);
//   const [isPending, startTransition] = useTransition();

//   return (
//     <div className="flex flex-col items-end">
//       <div className="flex items-center gap-1">
//         <button
//           type="button"
//           disabled={isPending}
//           onClick={() =>
//             startTransition(async () =>
//               setResult(await resendInvitation(invitationId))
//             )
//           }
//           className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold text-gwc-navy hover:bg-slate-100"
//         >
//           <RefreshCw className="h-3.5 w-3.5" /> Resend
//         </button>
//         <button
//           type="button"
//           disabled={isPending}
//           onClick={() => {
//             if (!confirm(`Cancel the invitation for ${email}?`)) return;
//             startTransition(async () =>
//               setResult(await revokeInvitation(invitationId))
//             );
//           }}
//           className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600"
//         >
//           <X className="h-3.5 w-3.5" /> Cancel
//         </button>
//       </div>
//       <div className="w-full max-w-md">
//         <Notice result={result} />
//       </div>
//     </div>
//   );
// }
