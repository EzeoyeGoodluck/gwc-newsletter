"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  MembersDirectory,
  type Member,
} from "@/components/members/members-directory";

import { AddMemberModal } from "@/components/members/add-member-modal";

import {
  CreateCategoryModal,
  type Category,
} from "@/components/members/create-category-modal";

import { EditMemberPage } from "@/components/members/edit-member-page";

import {
  listMembers,
  listCategories,
  getMemberProfile,
  createMember,
  updateMember,
  removeMember,
  createCategory,
  type MemberFormData,
} from "./actions";

const PAGE_SIZE = 10;

function MembersDirectorySkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-6">
      <span className="sr-only">Loading members…</span>

      <div
        aria-hidden="true"
        className="animate-pulse space-y-6 motion-reduce:animate-none"
      >
        {/* Heading and actions */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-3">
            <div className="h-8 w-52 max-w-full rounded bg-slate-200" />
            <div className="h-3 w-72 max-w-full rounded bg-slate-100" />
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="h-10 w-36 rounded-lg bg-slate-200" />
            <div className="h-10 w-32 rounded-lg bg-slate-200" />
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm md:flex-row">
          <div className="h-10 min-w-0 flex-1 rounded-lg bg-slate-100" />
          <div className="h-10 w-full rounded-lg bg-slate-100 md:w-40" />
          <div className="h-10 w-full rounded-lg bg-slate-100 md:w-44" />
        </div>

        {/* Member rows */}
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50 px-5 py-4">
            <div className="h-3 w-40 rounded bg-slate-200" />
            <div className="hidden h-3 flex-1 rounded bg-slate-200 md:block" />
            <div className="hidden h-3 w-24 rounded bg-slate-200 sm:block" />
            <div className="h-3 w-12 rounded bg-slate-200" />
          </div>

          <div className="divide-y divide-slate-100">
            {Array.from({ length: PAGE_SIZE }, (_, index) => (
              <div
                key={index}
                className="flex items-center gap-4 px-5 py-4"
              >
                <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200" />

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3 w-36 max-w-full rounded bg-slate-200" />
                  <div className="h-2.5 w-48 max-w-full rounded bg-slate-100" />
                </div>

                <div className="hidden h-5 w-24 rounded-full bg-slate-100 md:block" />
                <div className="hidden h-5 w-20 rounded-full bg-slate-100 sm:block" />
                <div className="h-7 w-7 shrink-0 rounded-md bg-slate-100" />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-5 py-4">
            <div className="h-3 w-32 rounded bg-slate-100" />

            <div className="flex gap-2">
              <div className="h-8 w-8 rounded-md bg-slate-100" />
              <div className="h-8 w-8 rounded-md bg-slate-200" />
              <div className="h-8 w-8 rounded-md bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MemberProfileSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-6">
      <span className="sr-only">Loading member profile…</span>

      <div
        aria-hidden="true"
        className="animate-pulse space-y-6 motion-reduce:animate-none"
      >
        <div className="space-y-3">
          <div className="h-3 w-28 rounded bg-slate-200" />
          <div className="h-8 w-48 rounded bg-slate-200" />
        </div>

        <div className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="mb-8 flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 rounded-full bg-slate-200" />

            <div className="min-w-0 space-y-3">
              <div className="h-5 w-40 max-w-full rounded bg-slate-200" />
              <div className="h-3 w-52 max-w-full rounded bg-slate-100" />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-3 w-24 rounded bg-slate-200" />
                <div className="h-10 w-full rounded-lg bg-slate-100" />
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <div className="h-10 w-24 rounded-lg bg-slate-100" />
            <div className="h-10 w-32 rounded-lg bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);

  const [roleFilter, setRoleFilter] = useState("All Members");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);

  const [editing, setEditing] = useState<{
    id: string;
    data: MemberFormData;
  } | null>(null);

  const [viewMode, setViewMode] = useState<"edit" | "view">("edit");
  const [message, setMessage] = useState<string | null>(null);

  const [membersLoading, setMembersLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [membersLoadFailed, setMembersLoadFailed] = useState(false);

  const membersRequestRef = useRef(0);
  const categoriesRequestRef = useRef(0);
  const profileRequestRef = useRef(0);
  const profileLoadingRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      membersRequestRef.current += 1;
      categoriesRequestRef.current += 1;
      profileRequestRef.current += 1;
    };
  }, []);

  const loadMembers = useCallback(async () => {
    const requestId = ++membersRequestRef.current;

    setMembersLoading(true);
    setMembersLoadFailed(false);

    const isCurrentRequest = () =>
      mountedRef.current && membersRequestRef.current === requestId;

    try {
      const result = await listMembers({
        page,
        pageSize: PAGE_SIZE,
        status: roleFilter,
        category: categoryFilter,
      });

      if (!isCurrentRequest()) return;

      if (result.ok) {
        setMembers(result.data.members);
        setTotal(result.data.total);
      } else {
        setMembersLoadFailed(true);
        setMessage(result.message);
      }
    } catch (error) {
      if (isCurrentRequest()) {
        console.error("Failed to load members:", error);
        setMembersLoadFailed(true);
        setMessage("Unable to load members. Please try again.");
      }
    } finally {
      if (isCurrentRequest()) {
        setMembersLoading(false);
      }
    }
  }, [page, roleFilter, categoryFilter]);

  const loadCategories = useCallback(async () => {
    const requestId = ++categoriesRequestRef.current;

    setCategoriesLoading(true);

    const isCurrentRequest = () =>
      mountedRef.current && categoriesRequestRef.current === requestId;

    try {
      const result = await listCategories();

      if (!isCurrentRequest()) return;

      if (result.ok) {
        setCategories(result.data);
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      if (isCurrentRequest()) {
        console.error("Failed to load categories:", error);
        setMessage("Unable to load categories. Please try again.");
      }
    } finally {
      if (isCurrentRequest()) {
        setCategoriesLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadMembers();

    return () => {
      membersRequestRef.current += 1;
    };
  }, [loadMembers]);

  useEffect(() => {
    void loadCategories();

    return () => {
      categoriesRequestRef.current += 1;
    };
  }, [loadCategories]);

  const handlePageChange = (nextPage: number) => {
    if (nextPage === page) return;

    setMessage(null);
    setMembersLoading(true);
    setPage(nextPage);
  };

  const handleRoleFilterChange = (role: string) => {
    if (role === roleFilter) return;

    setMessage(null);
    setMembersLoading(true);
    setRoleFilter(role);
    setPage(1);
  };

  const handleCategoryFilterChange = (category: string) => {
    if (category === categoryFilter) return;

    setMessage(null);
    setMembersLoading(true);
    setCategoryFilter(category);
    setPage(1);
  };

  const handleAddMember = async (
    newMember: Omit<Member, "id" | "memberId">
  ) => {
    setMessage(null);

    try {
      const result = await createMember(newMember);

      if (!mountedRef.current) return;

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      if (page !== 1) {
        // Changing the page triggers a fresh load with page 1.
        setMembersLoading(true);
        setPage(1);
      } else {
        await loadMembers();
      }
    } catch (error) {
      if (mountedRef.current) {
        console.error("Failed to add member:", error);
        setMessage(
          "The result could not be confirmed. Check the member list before trying again."
        );
      }
    }
  };

  const handleCreateCategory = async (category: Category) => {
    setMessage(null);

    try {
      const result = await createCategory(category);

      if (!mountedRef.current) return;

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      await loadCategories();
    } catch (error) {
      if (mountedRef.current) {
        console.error("Failed to create category:", error);
        setMessage(
          "The result could not be confirmed. Check the category list before trying again."
        );
      }
    }
  };

  const handleMemberAction = async (action: string, member: Member) => {
    if (profileLoadingRef.current) return;

    setMessage(null);

    if (action === "Remove Member") {
      if (
        !confirm(
          `Remove ${member.name}? This permanently deletes their record.`
        )
      ) {
        return;
      }

      try {
        const result = await removeMember(member.id);

        if (!mountedRef.current) return;

        if (!result.ok) {
          setMessage(result.message);
          return;
        }

        if (members.length === 1 && page > 1) {
          setMembersLoading(true);
          setPage((previous) => previous - 1);
        } else {
          await loadMembers();
        }
      } catch (error) {
        if (mountedRef.current) {
          console.error("Failed to remove member:", error);
          setMessage(
            "The removal result could not be confirmed. Refresh the list before trying again."
          );
        }
      }

      return;
    }

    if (action === "Edit Member" || action === "View Profile") {
      const requestId = ++profileRequestRef.current;

      profileLoadingRef.current = true;
      setProfileLoading(true);

      const isCurrentRequest = () =>
        mountedRef.current && profileRequestRef.current === requestId;

      try {
        const result = await getMemberProfile(member.id);

        if (!isCurrentRequest()) return;

        if (!result.ok) {
          setMessage(result.message);
          return;
        }

        setViewMode(action === "View Profile" ? "view" : "edit");
        setEditing({ id: member.id, data: result.data });
      } catch (error) {
        if (isCurrentRequest()) {
          console.error("Failed to load member profile:", error);
          setMessage("Unable to load this member profile. Please try again.");
        }
      } finally {
        if (isCurrentRequest()) {
          profileLoadingRef.current = false;
          setProfileLoading(false);
        }
      }
    }
  };

  const handleSaveEdit = async (formData: Partial<MemberFormData>) => {
    if (!editing) return;

    setMessage(null);

    try {
      const result = await updateMember(editing.id, formData);

      if (!mountedRef.current) return;

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setMembersLoading(true);
      setEditing(null);
      await loadMembers();
    } catch (error) {
      if (mountedRef.current) {
        console.error("Failed to update member:", error);
        setMessage(
          "The update result could not be confirmed. Check the member record before trying again."
        );
      }
    }
  };

  const banner = message && (
    <div
      role="alert"
      className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
    >
      {message}
    </div>
  );

  if (profileLoading) {
    return (
      <>
        {banner}
        <MemberProfileSkeleton />
      </>
    );
  }

  if (editing) {
    return (
      <>
        {banner}

        <EditMemberPage
          readOnly={viewMode === "view"}
          initialData={editing.data}
          availableCategories={categories.map((category) => category.name)}
          onCancel={() => setEditing(null)}
          onSave={handleSaveEdit}
        />
      </>
    );
  }

  const directoryLoading = membersLoading || categoriesLoading;

  return (
    <>
      {banner}

      {directoryLoading ? (
        <MembersDirectorySkeleton />
      ) : membersLoadFailed ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-gwc-navy">
            Unable to load members
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Please retry before using the member directory.
          </p>

          <button
            type="button"
            onClick={() => {
              setMessage(null);
              void loadMembers();
            }}
            className="mt-4 rounded-lg bg-gwc-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Try again
          </button>
        </div>
      ) : (
        <MembersDirectory
          members={members}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          roleFilter={roleFilter}
          categoryFilter={categoryFilter}
          availableCategories={categories.map((category) => category.name)}
          onPageChange={handlePageChange}
          onRoleFilterChange={handleRoleFilterChange}
          onCategoryFilterChange={handleCategoryFilterChange}
          onAddMember={() => setAddMemberOpen(true)}
          onCreateCategory={() => setCreateCategoryOpen(true)}
          onAction={handleMemberAction}
        />
      )}

      <AddMemberModal
        open={addMemberOpen}
        availableCategories={categories.map((category) => category.name)}
        onClose={() => setAddMemberOpen(false)}
        onSave={handleAddMember}
      />

      <CreateCategoryModal
        open={createCategoryOpen}
        onClose={() => setCreateCategoryOpen(false)}
        onCreate={handleCreateCategory}
      />
    </>
  );
}