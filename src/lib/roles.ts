export const ROLE_VALUES = ["OWNER", "ADMIN", "EDITOR", "VIEWER"] as const;
export type RoleValue = (typeof ROLE_VALUES)[number];

export type RoleLabel = "Owner" | "Administrator" | "Editor" | "Viewer";

export const ROLE_TO_LABEL: Record<RoleValue, RoleLabel> = {
  OWNER: "Owner",
  ADMIN: "Administrator",
  EDITOR: "Editor",
  VIEWER: "Viewer",
};

export const LABEL_TO_ROLE: Record<RoleLabel, RoleValue> = {
  Owner: "OWNER",
  Administrator: "ADMIN",
  Editor: "EDITOR",
  Viewer: "VIEWER",
};

export function toLabel(role: string): RoleLabel {
  return ROLE_TO_LABEL[role as RoleValue] ?? "Viewer";
}