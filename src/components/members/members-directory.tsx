"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Search, Plus } from "lucide-react";

import { CategoryTag } from "@/components/dashboard/category-tag";
import { MemberStatusBadge } from "@/components/members/member-status-badge";

export interface Member {
  id: string;
  name: string;
  avatarUrl?: string;
  role: string;
  groups: string[];
  status: "active" | "inactive" | "pending";
  joinedDate: string;
}

interface MembersDirectoryProps {
  members: Member[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onAddMember: () => void;
  onAction: (action: string, member: Member) => void;
}

export function MembersDirectory({
  members,
  total,
  page,
  pageSize,
  onPageChange,
  onAddMember,
  onAction,
}: MembersDirectoryProps) {
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-10">
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
          className="flex items-center gap-2 bg-gwc-navy text-white rounded-lg px-6 py-3 text-sm font-semibold shadow-sm hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          Add New Member
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gwc-border/20 shadow-sm">
        <div className="flex items-center justify-between gap-4 px-6 py-6 border-b border-gwc-border/20 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-gwc-muted-bg border border-gwc-border/50 rounded-lg px-6 py-3 text-sm text-gwc-text-body">
              All Roles
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-2 bg-gwc-muted-bg border border-gwc-border/50 rounded-lg px-6 py-3 text-sm text-gwc-text-body">
              All Groups
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-1 bg-gwc-muted-bg border border-gwc-border/50 rounded-lg px-6 py-3 text-sm text-gwc-text-body">
              All Statuses
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="flex items-center gap-1 bg-gwc-muted-bg border border-gwc-border/50 rounded-lg p-1">
            <button
              className="rounded-md bg-white shadow-sm p-2"
              aria-label="Grid view"
            >
              <div className="h-[18px] w-[18px]" />
            </button>
            <button className="rounded-md p-2" aria-label="List view">
              <div className="h-[18px] w-[18px]" />
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
                    className="rounded border-gwc-border"
                  />
                </th>
                <th className="py-4 px-6 font-semibold">Name</th>
                <th className="py-4 px-6 font-semibold">Role</th>
                <th className="py-4 px-6 font-semibold">Groups</th>
                <th className="py-4 px-6 font-semibold">Status</th>
                <th className="py-4 px-6 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  key={member.id}
                  className="border-b border-gwc-border/10 hover:bg-gwc-muted-bg/30"
                >
                  <td className="py-4 px-6">
                    <input
                      type="checkbox"
                      className="rounded border-gwc-border"
                    />
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gwc-navy/10 flex items-center justify-center text-xs font-semibold text-gwc-navy overflow-hidden">
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
                      <span className="font-medium text-gwc-text-heading">
                        {member.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gwc-text-body">
                    {member.role}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap gap-1.5">
                      {member.groups.map((g) => (
                        <CategoryTag key={g} category={g} />
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <MemberStatusBadge status={member.status} />
                  </td>
                  <td className="py-4 px-6 text-right">
                    <MemberActions member={member} onAction={onAction} />
                  </td>
                </tr>
              ))}
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
              className="text-sm font-medium px-4 py-2 rounded-md border border-gwc-border/50 text-gwc-text-body hover:bg-gwc-muted-bg disabled:opacity-50 disabled:cursor-not-allowed"
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
                className={`text-sm font-medium h-9 w-9 rounded-md ${
                  p === page
                    ? "bg-gwc-navy text-white shadow-sm"
                    : "border border-gwc-border/50 text-gwc-text-body hover:bg-gwc-muted-bg"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="text-sm font-medium px-4 py-2 rounded-md border border-gwc-border/50 text-gwc-text-body hover:bg-gwc-muted-bg disabled:opacity-50 disabled:cursor-not-allowed"
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
    "Edit Details",
    "Assign Administrative Role",
    "Remove Member",
  ];

  return (
    <div className="relative flex justify-end">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 bg-gwc-navy text-white rounded-lg px-6 py-3 text-sm font-semibold hover:brightness-110"
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
                className={`w-full text-left px-3 py-2 text-sm text-gwc-text-body hover:bg-gwc-muted-bg ${
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
