import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { can } from "@/lib/permissions";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const user = await requireUser();
  if (!can(user.role, "members.manage"))
    return new Response("Forbidden", { status: 403 });

  const { memberId } = await params;

  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      groups: { include: { group: { select: { name: true } } } },
      deliveries: {
        select: {
          status: true,
          sentAt: true,
          openedAt: true,
          clickedAt: true,
          newsletter: { select: { subject: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      privacyEvents: {
        orderBy: { createdAt: "desc" },
        select: { action: true, details: true, createdAt: true },
      },
    },
  });
  if (!member) return new Response("Not found", { status: 404 });

  const { unsubscribeToken, groups, deliveries, privacyEvents, ...personal } =
    member;
  void unsubscribeToken;

  const exportData = {
    exportedAt: new Date().toISOString(),
    personalData: personal,
    groups: groups.map((g) => g.group.name),
    emailHistory: deliveries.map((d) => ({
      newsletter: d.newsletter.subject,
      status: d.status,
      sentAt: d.sentAt,
      openedAt: d.openedAt,
      clickedAt: d.clickedAt,
    })),
    privacyHistory: privacyEvents,
  };

  await prisma.privacyEvent.create({
    data: { memberId, actorId: user.id, action: "data.exported" },
  });

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="member-${member.memberNumber}-data.json"`,
      "Cache-Control": "no-store",
    },
  });
}
