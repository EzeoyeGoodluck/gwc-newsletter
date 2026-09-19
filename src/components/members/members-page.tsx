"use client";

import { useState } from "react";
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

const MOCK_MEMBERS: Member[] = [
  {
    id: "1",
    memberId: "#GW-1042",
    name: "Martha Jenkins",
    email: "martha.j@example.com",
    phone: "(555) 123-4567",
    categories: ["Voices of Glory", "Women's Min"],
    status: "active",
  },
  {
    id: "2",
    memberId: "#GW-0015",
    name: "Deacon Robert Smith",
    email: "r.smith@gloryworship.org",
    phone: "(555) 987-6543",
    categories: ["Elders Council"],
    status: "active",
  },
  {
    id: "3",
    memberId: "#GW-2109",
    name: "Chloe Williams",
    email: "chloe.w@example.com",
    categories: [],
    status: "visitor",
  },
];

function generateMemberId(existing: Member[]): string {
  const nums = existing
    .map((m) => parseInt(m.memberId.replace("#GW-", ""), 10))
    .filter((n) => !isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `#GW-${String(next).padStart(4, "0")}`;
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>(MOCK_MEMBERS);
  const [categories, setCategories] = useState<Category[]>([
    { name: "Voices of Glory", description: "" },
    { name: "Women's Min", description: "" },
    { name: "Elders Council", description: "" },
  ]);
  const [page, setPage] = useState(1);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const pageSize = 3;
  const total = 428;

  const handleAddMember = (newMember: Omit<Member, "id" | "memberId">) => {
    const member: Member = {
      ...newMember,
      id: crypto.randomUUID(),
      memberId: generateMemberId(members),
    };
    setMembers((prev) => [member, ...prev]);
  };

  const handleCreateCategory = (category: Category) => {
    setCategories((prev) => [...prev, category]);
  };

  const handleMemberAction = (action: string, member: Member) => {
    if (action === "Remove Member") {
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      return;
    }
    if (action === "Edit Member") {
      setEditingMember(member);
      return;
    }
    console.log(action, member);
  };

  const handleSaveEdit = (formData: {
    fullName: string;
    email: string;
    phone: string;
    categories: string[];
    status: string;
  }) => {
    if (!editingMember) return;
    setMembers((prev) =>
      prev.map((m) =>
        m.id === editingMember.id
          ? {
              ...m,
              name: formData.fullName,
              email: formData.email,
              phone: formData.phone,
              categories: formData.categories,
              status: formData.status.toLowerCase() as Member["status"],
            }
          : m
      )
    );
    setEditingMember(null);
  };

  if (editingMember) {
    return (
      <EditMemberPage
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
      <MembersDirectory
        members={members}
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
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
