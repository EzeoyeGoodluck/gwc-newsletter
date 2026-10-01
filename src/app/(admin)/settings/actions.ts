"use server";

import { can } from "@/lib/permissions";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { uploadDir, uploadUrl, filenameFromUrl } from "@/lib/uploads";

type Result<T> = { ok: true; data: T } | { ok: false; message: string };

// ─────────────────────────────── Shared helpers ───────────────────────────────

const HEX = /^#[0-9A-Fa-f]{6}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LANGUAGES = ["en-US", "en-GB", "fr", "es", "pt"];
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/svg+xml": "svg",
};

async function requireAdmin() {
  const user = await requireUser();
  if (!can(user.role, "settings.manage")) {
    throw new Error("Only owners and admins can change settings.");
  }
  return user;
}

async function getOrCreate() {
  return prisma.churchSettings.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
}

type SettingsRow = Awaited<ReturnType<typeof getOrCreate>>;

function isValidTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────── Branding ───────────────────────────────

export type BrandingSettings = {
  displayName: string;
  primaryColor: string;
  accentColor: string;
  footerText: string;
  website: string;
  logoUrl: string | null;
};

function toBranding(s: SettingsRow): BrandingSettings {
  return {
    displayName: s.name,
    primaryColor: s.primaryColor,
    accentColor: s.accentColor,
    footerText: s.footerText ?? "",
    website: s.website ?? "",
    logoUrl: s.logoUrl,
  };
}

async function deleteLocalLogo(logoUrl: string | null) {
  const name = filenameFromUrl(logoUrl);
  if (!name) return;
  try {
    await unlink(path.join(uploadDir(), name));
  } catch {
    // already gone
  }
}

export async function getBrandingSettings(): Promise<Result<BrandingSettings>> {
  await requireUser();
  return { ok: true, data: toBranding(await getOrCreate()) };
}

export async function saveBrandingSettings(
  formData: FormData
): Promise<Result<BrandingSettings>> {
  let user;
  try {
    user = await requireAdmin();
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  const displayName = String(formData.get("displayName") ?? "").trim();
  const primaryColor = String(formData.get("primaryColor") ?? "")
    .trim()
    .toUpperCase();
  const accentColor = String(formData.get("accentColor") ?? "")
    .trim()
    .toUpperCase();
  const footerText = String(formData.get("footerText") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const removeLogo = formData.get("removeLogo") === "true";
  const logo = formData.get("logo");

  if (!displayName) return { ok: false, message: "Display name is required." };
  if (!HEX.test(primaryColor) || !HEX.test(accentColor)) {
    return {
      ok: false,
      message: "Colors must be 6-digit hex values, e.g. #06385B.",
    };
  }

  const current = await getOrCreate();
  let logoUrl = current.logoUrl;

  if (logo instanceof File && logo.size > 0) {
    const ext = ALLOWED_TYPES[logo.type];
    if (!ext)
      return { ok: false, message: "Logo must be a PNG, JPG, or SVG file." };
    if (logo.size > MAX_LOGO_BYTES)
      return { ok: false, message: "Logo must be under 2 MB." };

    const dir = uploadDir();
    await mkdir(dir, { recursive: true });
    const filename = `logo-${Date.now()}.${ext}`;
    await writeFile(
      path.join(dir, filename),
      Buffer.from(await logo.arrayBuffer())
    );

    await deleteLocalLogo(current.logoUrl);
    logoUrl = uploadUrl(filename);
  } else if (removeLogo) {
    await deleteLocalLogo(current.logoUrl);
    logoUrl = null;
  }

  const updated = await prisma.churchSettings.update({
    where: { id: "default" },
    data: {
      name: displayName,
      primaryColor,
      accentColor,
      footerText: footerText || null,
      website: website || null,
      logoUrl,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "settings.branding.update",
      entityType: "ChurchSettings",
      entityId: "default",
      details: {
        displayName,
        primaryColor,
        accentColor,
        logoChanged: logoUrl !== current.logoUrl,
      },
    },
  });

  return { ok: true, data: toBranding(updated) };
}

// ─────────────────────────────── Organization ───────────────────────────────

export type OrganizationSettings = {
  organizationName: string;
  publicEmail: string;
  phone: string;
  website: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  timeZone: string;
  language: string;
};

function toOrganization(s: SettingsRow): OrganizationSettings {
  return {
    organizationName: s.name,
    publicEmail: s.email ?? "",
    phone: s.phone ?? "",
    website: s.website ?? "",
    addressLine1: s.addressLine1 ?? "",
    addressLine2: s.addressLine2 ?? "",
    city: s.city ?? "",
    stateProvince: s.stateProvince ?? "",
    postalCode: s.postalCode ?? "",
    country: s.country ?? "",
    timeZone: s.timezone,
    language: s.language,
  };
}

export async function getOrganizationSettings(): Promise<
  Result<OrganizationSettings>
> {
  await requireUser();
  return { ok: true, data: toOrganization(await getOrCreate()) };
}

export async function saveOrganizationSettings(
  input: OrganizationSettings
): Promise<Result<OrganizationSettings>> {
  let user;
  try {
    user = await requireAdmin();
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  const v = Object.fromEntries(
    Object.entries(input).map(([k, val]) => [k, String(val ?? "").trim()])
  ) as OrganizationSettings;

  if (!v.organizationName)
    return { ok: false, message: "Organization name is required." };
  if (!EMAIL.test(v.publicEmail))
    return { ok: false, message: "Enter a valid public email address." };
  if (v.website) {
    try {
      new URL(v.website);
    } catch {
      return {
        ok: false,
        message: "Website must be a full URL, e.g. https://example.org",
      };
    }
  }
  if (!v.addressLine1 || !v.city || !v.country) {
    return {
      ok: false,
      message: "Address line 1, city, and country are required.",
    };
  }
  if (!isValidTimeZone(v.timeZone))
    return { ok: false, message: "Choose a valid time zone." };
  if (!LANGUAGES.includes(v.language))
    return { ok: false, message: "Choose a valid language." };

  const fullAddress = [
    v.addressLine1,
    v.addressLine2,
    v.city,
    [v.stateProvince, v.postalCode].filter(Boolean).join(" "),
    v.country,
  ]
    .filter(Boolean)
    .join(", ");

  const updated = await prisma.churchSettings.update({
    where: { id: "default" },
    data: {
      name: v.organizationName,
      email: v.publicEmail,
      phone: v.phone || null,
      website: v.website || null,
      addressLine1: v.addressLine1,
      addressLine2: v.addressLine2 || null,
      city: v.city,
      stateProvince: v.stateProvince || null,
      postalCode: v.postalCode || null,
      country: v.country,
      address: fullAddress,
      timezone: v.timeZone,
      language: v.language,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "settings.organization.update",
      entityType: "ChurchSettings",
      entityId: "default",
      details: {
        organizationName: v.organizationName,
        timeZone: v.timeZone,
        language: v.language,
      },
    },
  });

  return { ok: true, data: toOrganization(updated) };
}

// ─────────────────────────────── Communication ───────────────────────────────

export type CommunicationSettings = {
  senderName: string;
  senderEmail: string;
  replyToEmail: string;
  sendingTimeZone: string;
  unsubscribeText: string;
  sendSuccessAlerts: boolean;
  sendFailureAlerts: boolean;
  notificationRecipients: string;
  sendTestCopy: boolean;
};

function toCommunication(s: SettingsRow): CommunicationSettings {
  return {
    senderName: s.senderName ?? s.name,
    senderEmail: s.senderEmail ?? "",
    replyToEmail: s.replyTo ?? s.email ?? "",
    sendingTimeZone: s.timezone,
    unsubscribeText:
      s.unsubscribeText ??
      `You are receiving this email because you are connected with ${s.name}. You may update your communication preferences or unsubscribe at any time.`,
    sendSuccessAlerts: s.alertOnSuccess,
    sendFailureAlerts: s.alertOnFailure,
    notificationRecipients: s.alertRecipients ?? "",
    sendTestCopy: s.defaultTestSend,
  };
}

export async function getCommunicationSettings(): Promise<
  Result<CommunicationSettings>
> {
  await requireUser();
  return { ok: true, data: toCommunication(await getOrCreate()) };
}

export async function saveCommunicationSettings(
  input: CommunicationSettings
): Promise<Result<CommunicationSettings>> {
  let user;
  try {
    user = await requireAdmin();
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  const senderName = String(input.senderName ?? "").trim();
  const senderEmail = String(input.senderEmail ?? "")
    .trim()
    .toLowerCase();
  const replyTo = String(input.replyToEmail ?? "")
    .trim()
    .toLowerCase();
  const timezone = String(input.sendingTimeZone ?? "").trim();
  const unsubscribeText = String(input.unsubscribeText ?? "").trim();

  const recipients = String(input.notificationRecipients ?? "")
    .split(/[,;\s]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!senderName) return { ok: false, message: "Sender name is required." };
  if (!EMAIL.test(senderEmail))
    return { ok: false, message: "Enter a valid sender email." };
  if (!EMAIL.test(replyTo))
    return { ok: false, message: "Enter a valid reply-to email." };
  if (!isValidTimeZone(timezone))
    return { ok: false, message: "Choose a valid time zone." };
  if (!unsubscribeText)
    return { ok: false, message: "Unsubscribe text is required." };

  const badRecipient = recipients.find((r) => !EMAIL.test(r));
  if (badRecipient) {
    return {
      ok: false,
      message: `"${badRecipient}" is not a valid email address.`,
    };
  }

  const wantsAlerts =
    Boolean(input.sendSuccessAlerts) || Boolean(input.sendFailureAlerts);
  if (wantsAlerts && recipients.length === 0) {
    return {
      ok: false,
      message: "Add at least one alert recipient, or turn off delivery alerts.",
    };
  }

  const updated = await prisma.churchSettings.update({
    where: { id: "default" },
    data: {
      senderName,
      senderEmail,
      replyTo,
      timezone,
      unsubscribeText,
      alertRecipients: recipients.length ? recipients.join(", ") : null,
      alertOnSuccess: Boolean(input.sendSuccessAlerts),
      alertOnFailure: Boolean(input.sendFailureAlerts),
      defaultTestSend: Boolean(input.sendTestCopy),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "settings.communication.update",
      entityType: "ChurchSettings",
      entityId: "default",
      details: {
        senderName,
        senderEmail,
        replyTo,
        timezone,
        alertRecipients: recipients,
      },
    },
  });

  return { ok: true, data: toCommunication(updated) };
}
