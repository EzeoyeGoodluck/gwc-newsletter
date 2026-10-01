import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { can } from "@/lib/permissions";

function csv(value: unknown) {
  const s = value instanceof Date ? value.toISOString() : String(value ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  const user = await requireUser();
  if (!can(user.role, "members.manage")) return new Response("Forbidden", { status: 403 });

  const members = await prisma.member.findMany({
    orderBy: { memberNumber: "asc" },
    select: {
      memberNumber: true,
      name: true,
      email: true,
      status: true,
      consentAt: true,
      consentSource: true,
      unsubscribedAt: true,
      updatedAt: true,
    },
  });

  const rows = [
    ["Member #", "Name", "Email", "Email status", "Consent date", "Consent source", "Unsubscribed at", "Last updated"],
    ...members.map((m) => [
      m.memberNumber,
      m.name,
      m.email,
      m.status,
      m.consentAt,
      m.consentSource,
      m.unsubscribedAt,
      m.updatedAt,
    ]),
  ];

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "privacy.log.export",
      entityType: "Member",
      details: { count: members.length },
    },
  });

  return new Response(rows.map((r) => r.map(csv).join(",")).join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="consent-records-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}