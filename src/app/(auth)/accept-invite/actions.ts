"use server";

import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getValidInvitation } from "@/lib/invitations";

type Result = { ok: true } | { ok: false; message: string };

export async function acceptInvitation(formData: FormData): Promise<Result> {
  const token = String(formData.get("token") ?? "");
  const name = String(formData.get("fullName") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (password !== confirmPassword) {
    return {
      ok: false,
      message: "Passwords do not match. Please check them and try again.",
    };
  }

  if (password.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters." };
  }

  const invitation = await getValidInvitation(token);

  if (!invitation) {
    return {
      ok: false,
      message: "This invitation is invalid, expired, or has already been used.",
    };
  }

  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { claimedAt: new Date() },
  });

  try {
    await auth.api.signUpEmail({
      body: { name, email: invitation.email, password },
      headers: await headers(),
    });
  } catch (error) {
    const message =
      error instanceof APIError
        ? (error.body?.message ?? error.message)
        : "We could not create your account. Please try again.";
    return { ok: false, message };
  }

  await prisma.invitation.update({
    where: { id: invitation.id },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });

  return { ok: true };
}
