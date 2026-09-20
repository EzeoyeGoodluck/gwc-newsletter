"use client";

import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { CategoryTag } from "@/components/dashboard/category-tag";

export type MemberStatus = "active" | "inactive" | "visitor";

export interface Member {
  id: string;
  memberId: string;
  name: string;
  avatarUrl?: string;
  email: string;
  phone?: string;
  categories: string[];
  status: MemberStatus;
}

interface MembersDirectoryProps {
  members: Member[];
  total: number;
  page: number;
  pageSize: number;
  roleFilter: string;
  categoryFilter: string;
  availableCategories: string[];
  onPageChange: (page: number) => void;
  onRoleFilterChange: (role: string) => void;
  onCategoryFilterChange: (category: string) => void;
  onAddMember: () => void;
  onCreateCategory: () => void;
  onAction: (action: string, member: Member) => void;
}

const statusConfig: Record<
  MemberStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  active: {
    label: "Active",
    bg: "bg-gwc-navy/5",
    text: "text-gwc-navy",
    dot: "bg-gwc-navy",
  },
  inactive: {
    label: "Inactive",
    bg: "bg-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-500",
  },
  visitor: {
    label: "Visitor",
    bg: "bg-gray-200",
    text: "text-gray-600",
    dot: "bg-gray-500",
  },
};

function StatusPill({ status }: { status: MemberStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full ${config.bg} ${config.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

const ROLE_OPTIONS = ["All Members", "Active", "Inactive", "Visitor"];

export function MembersDirectory({
  members,
  total,
  page,
  pageSize,
  roleFilter,
  categoryFilter,
  availableCategories,
  onPageChange,
  onRoleFilterChange,
  onCategoryFilterChange,
  onAddMember,
  onCreateCategory,
  onAction,
}: MembersDirectoryProps) {
  const [rolesOpen, setRolesOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const categoryOptions = ["All Categories", ...availableCategories];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="flex flex-col gap-1">
          <h1 className="text-[32px] font-semibold text-gwc-navy tracking-tight">
            Members Directory
          </h1>
          <p className="text-base text-gwc-text-body">
            Manage congregation records, groups, and membership status.
          </p>
        </div>
        <button
          onClick={onAddMember}
          className="flex items-center gap-2 bg-gwc-navy text-white rounded-lg px-6 py-3 text-sm font-semibold shadow-sm cursor-pointer hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          Add New Member
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gwc-border/20 shadow-sm">
        <div className="flex items-center justify-between gap-4 px-6 py-6 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <button
                onClick={() => {
                  setRolesOpen((v) => !v);
                  setCategoriesOpen(false);
                }}
                className="flex items-center gap-2 bg-gwc-muted-bg border border-gwc-border/50 rounded-lg px-6 py-3 text-sm text-gwc-text-body cursor-pointer hover:bg-gwc-border/10 transition-colors"
              >
                {roleFilter}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {rolesOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setRolesOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-1 z-20 w-48 bg-white rounded-md shadow-lg border border-gwc-border/20 py-1">
                    {ROLE_OPTIONS.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          onRoleFilterChange(option);
                          setRolesOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gwc-text-body hover:bg-gwc-muted-bg cursor-pointer"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <span className="text-sm text-gwc-text-muted">Category:</span>

            <div className="relative">
              <button
                onClick={() => {
                  setCategoriesOpen((v) => !v);
                  setRolesOpen(false);
                }}
                className="flex items-center gap-2 bg-white border border-gwc-border rounded-lg px-6 py-3 text-sm text-gwc-text-body cursor-pointer hover:bg-gwc-muted-bg transition-colors"
              >
                {categoryFilter}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {categoriesOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setCategoriesOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-1 z-20 w-48 bg-white rounded-md shadow-lg border border-gwc-border/20 py-1 max-h-64 overflow-y-auto">
                    {categoryOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          onCategoryFilterChange(option);
                          setCategoriesOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gwc-text-body hover:bg-gwc-muted-bg cursor-pointer"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={onCreateCategory}
              className="flex items-center gap-1.5 bg-gwc-muted-bg border border-gwc-border/50 rounded-lg px-4 py-3 text-sm font-medium text-gwc-text-body cursor-pointer hover:bg-gwc-border/10 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Category
            </button>
          </div>

          <div className="flex items-center gap-1 bg-white border border-gwc-border rounded-lg p-1">
            <button
              className="rounded-md bg-gwc-muted-bg p-2 cursor-pointer"
              aria-label="List view"
            >
              <div className="h-[18px] w-[18px] flex flex-col gap-[3px] justify-center">
                <div className="h-[2px] w-full bg-gwc-text-body rounded-full" />
                <div className="h-[2px] w-full bg-gwc-text-body rounded-full" />
                <div className="h-[2px] w-full bg-gwc-text-body rounded-full" />
              </div>
            </button>
            <button
              className="rounded-md p-2 cursor-pointer hover:bg-gwc-muted-bg"
              aria-label="Grid view"
            >
              <div className="h-[18px] w-[18px] grid grid-cols-2 gap-[2px]">
                <div className="bg-gwc-text-muted rounded-sm" />
                <div className="bg-gwc-text-muted rounded-sm" />
                <div className="bg-gwc-text-muted rounded-sm" />
                <div className="bg-gwc-text-muted rounded-sm" />
              </div>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gwc-muted-bg/50 border-b border-gwc-border/20 text-left text-gwc-text-muted">
                <th className="py-4 px-6 font-semibold w-16">
                  <input
                    type="checkbox"
                    className="rounded border-gwc-border cursor-pointer"
                  />
                </th>
                <th className="py-4 px-6 font-semibold">Member Details</th>
                <th className="py-4 px-6 font-semibold">Contact</th>
                <th className="py-4 px-6 font-semibold">Status</th>
                <th className="py-4 px-6 font-semibold">Categories</th>
                <th className="py-4 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 px-6 text-center text-gwc-text-muted"
                  >
                    No members found.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-gwc-border/10 hover:bg-gwc-muted-bg/30"
                  >
                    <td className="py-4 px-6">
                      <input
                        type="checkbox"
                        className="rounded border-gwc-border cursor-pointer"
                      />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gwc-text-body overflow-hidden shrink-0">
                          {member.avatarUrl ? (
                            <img
                              src={member.avatarUrl}
                              alt={member.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gwc-text-heading leading-tight">
                            {member.name}
                          </p>
                          <p className="text-xs text-gwc-text-muted/70 mt-0.5">
                            ID: {member.memberId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-gwc-text-heading">{member.email}</p>
                      <p className="text-gwc-text-muted text-[13px] mt-0.5">
                        {member.phone ?? "--"}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <StatusPill status={member.status} />
                    </td>
                    <td className="py-4 px-6">
                      {member.categories.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {member.categories.map((c) => (
                            <CategoryTag key={c} category={c} />
                          ))}
                        </div>
                      ) : (
                        <span className="text-gwc-text-muted italic text-sm">
                          None
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <MemberActions member={member} onAction={onAction} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-6 border-t border-gwc-border/20 flex-wrap gap-4">
          <p className="text-sm text-gwc-text-body">
            Showing {start} to {end} of {total} members
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="text-sm font-medium px-4 py-2 rounded-md border border-gwc-border/50 text-gwc-text-body cursor-pointer hover:bg-gwc-muted-bg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from(
              { length: Math.min(totalPages, 3) },
              (_, i) => i + 1
            ).map((p) => (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`text-sm font-medium h-9 w-9 rounded-md cursor-pointer ${
                  p === page
                    ? "bg-gwc-navy text-white shadow-sm"
                    : "border border-gwc-border/50 text-gwc-text-body hover:bg-gwc-muted-bg"
                }`}
              >
                {p}
              </button>
            ))}
            {totalPages > 3 && (
              <span className="text-sm text-gwc-text-muted px-1">...</span>
            )}
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="text-sm font-medium px-4 py-2 rounded-md border border-gwc-border/50 text-gwc-text-body cursor-pointer hover:bg-gwc-muted-bg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MemberActions({
  member,
  onAction,
}: {
  member: Member;
  onAction: (action: string, member: Member) => void;
}) {
  const [open, setOpen] = useState(false);
  const actions = [
    "View Profile",
    "Edit Member",
    "Manage Categories",
    "Send Direct Email",
    "Assign Admin",
    "Privacy & GDPR",
    "Remove Member",
  ];

  return (
    <div className="relative flex justify-end">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 bg-gwc-navy text-white rounded-lg px-4 py-2 text-sm font-medium cursor-pointer hover:brightness-110"
      >
        Select
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-56 bg-white rounded-md shadow-lg border border-gwc-border/20 py-1">
            {actions.map((action) => (
              <button
                key={action}
                onClick={() => {
                  onAction(action, member);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm text-gwc-text-body hover:bg-gwc-muted-bg cursor-pointer ${
                  action === "Remove Member" ? "text-red-600" : ""
                }`}
              >
                {action}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
