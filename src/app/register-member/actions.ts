"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type JoinResult = { ok: true } | { ok: false; message: string };

const NEWSLETTER_CONSENT_TEXT =
  "I would like to receive Glory Worship Church newsletter emails. I can unsubscribe at any time.";

function getText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() : "";
}

export async function listPublicJoinCategories() {
  return prisma.group.findMany({
    where: { isPublicSignup: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function joinChurch(formData: FormData): Promise<JoinResult> {
  const fullName = getText(formData, "fullName");
  const email = getText(formData, "email").toLowerCase();
  const phone = getText(formData, "phone");
  const website = getText(formData, "website");
  const turnstileToken = getText(formData, "turnstileToken");
  const recordConsent = formData.get("recordConsent") === "on";
  const newsletterConsent = formData.get("newsletterConsent") === "on";
  if (website) return { ok: true };
  if (fullName.length < 2 || fullName.length > 120) {
    return {
      ok: false,
      message: "Enter your full name, up to 120 characters.",
    };
  }
  if (
    email.length > 254 ||
    !/^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(email)
  ) {
    return { ok: false, message: "Enter one valid email address." };
  }
  if (phone.length > 40)
    return { ok: false, message: "The phone number is too long." };
  if (!recordConsent)
    return {
      ok: false,
      message:
        "Please confirm that we may use your details to manage your church contact record.",
    };
  const rawCategoryIds = formData.getAll("categoryIds");
  if (
    rawCategoryIds.length > 100 ||
    rawCategoryIds.some(
      (value) =>
        typeof value !== "string" || !value.trim() || value.length > 191
    )
  )
    return {
      ok: false,
      message:
        "The category selection is invalid. Please refresh the page and try again.",
    };
  const selectedCategoryIds = [
    ...new Set(rawCategoryIds.map((value) => String(value).trim())),
  ];
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const appUrl = process.env.APP_URL?.trim();
  if (!secret || !appUrl)
    return {
      ok: false,
      message:
        "The joining form is not configured yet. Please contact the church team.",
    };
  if (!turnstileToken || turnstileToken.length > 2048)
    return {
      ok: false,
      message: "Please complete the security check and try again.",
    };
  try {
    const expectedHostname = new URL(appUrl).hostname;
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: turnstileToken }),
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      }
    );
    if (!response.ok)
      return {
        ok: false,
        message: "The security check could not be verified. Please try again.",
      };
    const verification = (await response.json()) as {
      success?: boolean;
      hostname?: string;
      action?: string;
    };
    if (
      verification.success !== true ||
      verification.hostname !== expectedHostname ||
      verification.action !== "member-join"
    )
      return {
        ok: false,
        message:
          "The security check expired or could not be verified. Please try again.",
      };
    const existing = await prisma.member.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) return { ok: true };
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const result: JoinResult = await prisma.$transaction(async (tx) => {
          if (selectedCategoryIds.length > 0) {
            const matching = await tx.group.findMany({
              where: { id: { in: selectedCategoryIds }, isPublicSignup: true },
              select: { id: true },
            });
            if (matching.length !== selectedCategoryIds.length)
              return {
                ok: false,
                message:
                  "One of the selected categories is no longer available. Please refresh the page.",
              };
          }
          const maximum = await tx.member.aggregate({
            _max: { memberNumber: true },
          });
          const member = await tx.member.create({
            data: {
              memberNumber: (maximum._max.memberNumber ?? 1000) + 1,
              name: fullName,
              email,
              phone: phone || null,
              membershipStatus: "visitor",
              membershipType: "Visitor",
              status: newsletterConsent ? "SUBSCRIBED" : "UNSUBSCRIBED",
              consentAt: newsletterConsent ? new Date() : null,
              consentSource: newsletterConsent ? "public_join_v1" : null,
              source: "public_join",
            },
            select: { id: true },
          });
          if (selectedCategoryIds.length > 0) {
            await tx.memberGroup.createMany({
              data: selectedCategoryIds.map((groupId) => ({
                memberId: member.id,
                groupId,
              })),
            });
          }
          await tx.privacyEvent.create({
            data: {
              memberId: member.id,
              action: "PUBLIC_JOIN",
              details: {
                source: "public_join",
                recordConsent: true,
                newsletterConsent,
                newsletterConsentText: NEWSLETTER_CONSENT_TEXT,
                selectedCategoryIds,
                categorySelectionSource: "member_self_selection",
              },
            },
          });
          return { ok: true };
        });
        return result;
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === "P2002") {
            const duplicate = await prisma.member.findUnique({
              where: { email },
              select: { id: true },
            });
            if (duplicate) return { ok: true };
            continue;
          }
          if (error.code === "P2034") continue;
        }
        throw error;
      }
    }
    return {
      ok: false,
      message: "The form is busy. Please wait a moment and try again.",
    };
  } catch {
    console.error("[public-join] Submission failed.");
    return {
      ok: false,
      message:
        "We could not confirm your submission. Please try again or contact the church team.",
    };
  }
}
