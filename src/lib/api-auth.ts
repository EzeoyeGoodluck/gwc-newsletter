import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { can, type Permission } from "@/lib/permissions";

export async function requireApiPermission(
  request: Request,
  permission: Permission
) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!can(session.user.role, permission)) {
    return {
      user: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user: session.user, error: null };
}
