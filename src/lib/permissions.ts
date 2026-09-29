export const ROLES = ["OWNER", "ADMIN", "EDITOR", "VIEWER"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Administrator",
  EDITOR: "Editor",
  VIEWER: "Viewer",
};

const PERMISSIONS = {
  "dashboard.view": ["OWNER", "ADMIN", "EDITOR", "VIEWER"],
  "newsletters.view": ["OWNER", "ADMIN", "EDITOR", "VIEWER"],
  "newsletters.edit": ["OWNER", "ADMIN", "EDITOR"],
  "newsletters.publish": ["OWNER", "ADMIN", "EDITOR"],
  "events.view": ["OWNER", "ADMIN", "EDITOR", "VIEWER"],
  "events.edit": ["OWNER", "ADMIN", "EDITOR"],
  "subscribers.manage": ["OWNER", "ADMIN"],
  "team.manage": ["OWNER", "ADMIN"],
  "settings.manage": ["OWNER", "ADMIN"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: string | null | undefined, permission: Permission) {
  return (
    !!role && (PERMISSIONS[permission] as readonly string[]).includes(role)
  );
}

export function canManageRole(
  actorRole: string | null | undefined,
  targetRole: string
) {
  if (actorRole === "OWNER") return targetRole !== "OWNER";
  if (actorRole === "ADMIN")
    return targetRole === "EDITOR" || targetRole === "VIEWER";
  return false;
}

export function assignableRoles(actorRole: string | null | undefined): Role[] {
  return (["ADMIN", "EDITOR", "VIEWER"] as Role[]).filter((r) =>
    canManageRole(actorRole, r)
  );
}
