"use server";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { sendEmail } from "@/lib/email";

type Result = { ok: true } | { ok: false; message: string };

const CATEGORIES = [
  "Newsletters & Templates",
  "Members & Directory",
  "Settings & Access",
  "Privacy & GDPR",
  "Technical issue",
];

export async function submitSupportRequest(
  formData: FormData
): Promise<Result> {
  const user = await requireUser();

  const subject = String(formData.get("subject") ?? "")
    .trim()
    .slice(0, 150);
  const category = String(formData.get("category") ?? "");
  const description = String(formData.get("description") ?? "")
    .trim()
    .slice(0, 5000);
  const pageUrl = String(formData.get("pageUrl") ?? "").slice(0, 300);

  if (!subject) return { ok: false, message: "Add a subject." };
  if (!CATEGORIES.includes(category))
    return { ok: false, message: "Choose a category." };
  if (description.length < 10)
    return {
      ok: false,
      message: "Describe the problem in a little more detail.",
    };

  const settings = await prisma.churchSettings.findUnique({
    where: { id: "default" },
  });
  const to = process.env.SUPPORT_EMAIL || settings?.email;
  if (!to)
    return {
      ok: false,
      message:
        "No support address is configured. Set SUPPORT_EMAIL in the environment.",
    };

  const result = await sendEmail({
    to,
    replyTo: user.email,
    subject: `[Support] ${category}: ${subject}`,
    text: [
      `From: ${user.name} <${user.email}> (${user.role})`,
      `Church: ${settings?.name ?? "Unknown"}`,
      `Category: ${category}`,
      pageUrl ? `Page: ${pageUrl}` : null,
      `Sent: ${new Date().toISOString()}`,
      "",
      description,
    ]
      .filter((line) => line !== null)
      .join("\n"),
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "support.request",
      entityType: "Support",
      details: { subject, category, delivered: result.ok },
    },
  });

  if (!result.ok) {
    return {
      ok: false,
      message: `We couldn't send your request: ${result.error}`,
    };
  }
  return { ok: true };
}

export type SystemStatus = {
  database: boolean;
  email: "ok" | "not_configured" | "failing" | "untested";
  emailProvider: string | null;
};

export async function getSystemStatus(): Promise<SystemStatus> {
  await requireUser();

  let database = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = false;
  }

  const provider = database
    ? await prisma.emailProvider.findFirst({ where: { isActive: true } })
    : null;

  return {
    database,
    emailProvider: provider?.name ?? null,
    email: !provider
      ? "not_configured"
      : provider.lastTestOk === true
        ? "ok"
        : provider.lastTestOk === false
          ? "failing"
          : "untested",
  };
}
