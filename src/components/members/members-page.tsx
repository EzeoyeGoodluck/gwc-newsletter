"use client";

import { useState, useEffect, useCallback } from "react";
import {
  MembersDirectory,
  Member,
} from "@/components/members/members-directory";
import { AddMemberModal } from "@/components/members/add-member-modal";
import {
  CreateCategoryModal,
  Category,
} from "@/components/members/create-category-modal";
import { EditMemberPage } from "@/components/members/edit-member-page";

import {
  listCategories,
  listMembers,
  createMember,
  createCategory,
  updateMember,
  removeMember,
} from "@/app/(admin)/members/actions";

const PAGE_SIZE = 10;

type CategoryLike = string | { name: string; description?: string | null };

function toCategories(data: CategoryLike[]): Category[] {
  return data.map((c) =>
    typeof c === "string"
      ? { name: c, description: "" }
      : { name: c.name, description: c.description ?? "" }
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
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [viewMode, setViewMode] = useState<"edit" | "view">("edit");
  const [message, setMessage] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    const res = await listMembers({
      page,
      pageSize: PAGE_SIZE,
      status: roleFilter,
      category: categoryFilter,
    });
    if (res.ok) {
      setMembers(res.data.members);
      setTotal(res.data.total);
    } else {
      setMessage(res.message);
    }
  }, [page, roleFilter, categoryFilter]);

  const loadCategories = useCallback(async () => {
    const res = await listCategories();
    if (res?.ok) setCategories(toCategories(res.data));
    else if (Array.isArray(res)) setCategories(toCategories(res));
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

  const handleAddMember = async (
    newMember: Omit<Member, "id" | "memberId">
  ) => {
    setMessage(null);
    const res = await createMember({
      name: newMember.name,
      email: newMember.email,
      phone: newMember.phone,
      status: newMember.status,
      categories: newMember.categories,
    });
    if (!res.ok) {
      setMessage(res.message);
      return;
    }
    await Promise.all([loadMembers(), loadCategories()]);
  };

  const handleCreateCategory = async (category: Category) => {
    setMessage(null);
    const res = await createCategory({
      name: category.name,
      description: category.description,
    });
    if (!res.ok) {
      setMessage(res.message);
      return;
    }
    await loadCategories();
  };

  const handleMemberAction = async (action: string, member: Member) => {
    if (action === "Remove Member") {
      if (!confirm(`Remove ${member.name}?`)) return;
      const res = await removeMember(member.id);
      if (!res.ok) setMessage(res.message);
      await loadMembers();
      return;
    }
    if (action === "Edit Member") {
      setViewMode("edit");
      setEditingMember(member);
      return;
    }
    if (action === "View Profile") {
      setViewMode("view");
      setEditingMember(member);
      return;
    }
    console.log(action, member);
  };

  const handleSaveEdit = async (formData: {
    fullName: string;
    email: string;
    phone: string;
    categories: string[];
    status: string;
  }) => {
    if (!editingMember) return;
    const res = await updateMember(editingMember.id, {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      categories: formData.categories,
      status: formData.status.toLowerCase() as Member["status"],
    });
    if (!res.ok) {
      setMessage(res.message);
      return;
    }
    setEditingMember(null);
    await Promise.all([loadMembers(), loadCategories()]);
  };

  if (editingMember) {
    return (
      <EditMemberPage
        readOnly={viewMode === "view"}
        initialData={{
          fullName: editingMember.name,
          email: editingMember.email,
          phone: editingMember.phone ?? "",
          dateOfBirth: "",
          gender: "Female",
          streetAddress: "",
          city: "",
          state: "",
          postalCode: "",
          country: "United States",
          membershipType: "Regular Member",
          status:
            editingMember.status.charAt(0).toUpperCase() +
            editingMember.status.slice(1),
          joinDate: "",
          renewalDate: "",
          categories: editingMember.categories,
          notes: "",
        }}
        availableCategories={categories.map((c) => c.name)}
        onCancel={() => setEditingMember(null)}
        onSave={handleSaveEdit}
      />
    );
  }

  return (
    <>
      {message && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
        </div>
      )}

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
