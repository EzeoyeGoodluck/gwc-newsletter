"use client";

import { useCallback, useEffect, useState } from "react";
import { MembersDirectory, Member } from "@/components/members/members-directory";
import { AddMemberModal } from "@/components/members/add-member-modal";
import { CreateCategoryModal, Category } from "@/components/members/create-category-modal";
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

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("All Members");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: string; data: MemberFormData } | null>(null);
  const [viewMode, setViewMode] = useState<"edit" | "view">("edit");
  const [message, setMessage] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    const res = await listMembers({ page, pageSize: PAGE_SIZE, status: roleFilter, category: categoryFilter });
    if (res.ok) {
      setMembers(res.data.members);
      setTotal(res.data.total);
    } else {
      setMessage(res.message);
    }
  }, [page, roleFilter, categoryFilter]);

  const loadCategories = useCallback(async () => {
    const res = await listCategories();
    if (res.ok) setCategories(res.data);
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleRoleFilterChange = (role: string) => {
    setRoleFilter(role);
    setPage(1);
  };

  const handleCategoryFilterChange = (category: string) => {
    setCategoryFilter(category);
    setPage(1);
  };

  const handleAddMember = async (newMember: Omit<Member, "id" | "memberId">) => {
    setMessage(null);
    const res = await createMember(newMember);
    if (!res.ok) return setMessage(res.message);
    setPage(1);
    await loadMembers();
  };

  const handleCreateCategory = async (category: Category) => {
    setMessage(null);
    const res = await createCategory(category);
    if (!res.ok) return setMessage(res.message);
    await loadCategories();
  };

  const handleMemberAction = async (action: string, member: Member) => {
    setMessage(null);

    if (action === "Remove Member") {
      if (!confirm(`Remove ${member.name}? This permanently deletes their record.`)) return;
      const res = await removeMember(member.id);
      if (!res.ok) return setMessage(res.message);
      await loadMembers();
      return;
    }

    if (action === "Edit Member" || action === "View Profile") {
      const res = await getMemberProfile(member.id);
      if (!res.ok) return setMessage(res.message);
      setViewMode(action === "View Profile" ? "view" : "edit");
      setEditing({ id: member.id, data: res.data });
    }
  };

  const handleSaveEdit = async (formData: Partial<MemberFormData>) => {
    if (!editing) return;
    setMessage(null);
    const res = await updateMember(editing.id, formData);
    if (!res.ok) return setMessage(res.message);
    setEditing(null);
    await loadMembers();
  };

  const banner = message && (
    <div role="alert" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      {message}
    </div>
  );

  if (editing) {
    return (
      <>
        {banner}
        <EditMemberPage
          readOnly={viewMode === "view"}
          initialData={editing.data}
          availableCategories={categories.map((c) => c.name)}
          onCancel={() => setEditing(null)}
          onSave={handleSaveEdit}
        />
      </>
    );
  }

  return (
    <>
      {banner}
      <MembersDirectory
        members={members}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        roleFilter={roleFilter}
        categoryFilter={categoryFilter}
        availableCategories={categories.map((c) => c.name)}
        onPageChange={setPage}
        onRoleFilterChange={handleRoleFilterChange}
        onCategoryFilterChange={handleCategoryFilterChange}
        onAddMember={() => setAddMemberOpen(true)}
        onCreateCategory={() => setCreateCategoryOpen(true)}
        onAction={handleMemberAction}
      />

      <AddMemberModal
        open={addMemberOpen}
        availableCategories={categories.map((c) => c.name)}
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