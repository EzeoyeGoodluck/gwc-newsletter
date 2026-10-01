"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Member, MemberStatus } from "@/components/members/members-directory";

interface AddMemberModalProps {
  open: boolean;
  availableCategories: string[];
  onClose: () => void;
  onSave: (member: Omit<Member, "id" | "memberId">) => void;
}

export function AddMemberModal({
  open,
  availableCategories,
  onClose,
  onSave,
}: AddMemberModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<MemberStatus>("active");
  const [categories, setCategories] = useState<string[]>([]);
  const [categoryInput, setCategoryInput] = useState("");

  if (!open) return null;

  const addCategory = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
    }
    setCategoryInput("");
  };

  const removeCategory = (value: string) => {
    setCategories(categories.filter((c) => c !== value));
  };

  const handleSave = () => {
    if (!name.trim() || !email.trim()) return;

    // Include anything still typed in the category box
    const pending = categoryInput.trim();
    const finalCategories =
      pending && !categories.includes(pending)
        ? [...categories, pending]
        : categories;

    onSave({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      categories: finalCategories,
      status,
    });

    setName("");
    setEmail("");
    setPhone("");
    setStatus("active");
    setCategories([]);
    setCategoryInput("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gwc-navy">
            Add New Member
          </h2>
          <button
            onClick={onClose}
            className="text-gwc-text-muted hover:text-gwc-text-heading"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gwc-text-heading">
              Full Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              className="border border-gwc-border rounded-lg px-4 py-3 text-sm bg-gwc-muted-bg focus:outline-none focus:ring-2 focus:ring-gwc-navy/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gwc-text-heading">
              Email Address
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. john@example.com"
              type="email"
              className="border border-gwc-border rounded-lg px-4 py-3 text-sm bg-gwc-muted-bg focus:outline-none focus:ring-2 focus:ring-gwc-navy/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gwc-text-heading">
              Phone Number
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. (555) 000-0000"
              className="border border-gwc-border rounded-lg px-4 py-3 text-sm bg-gwc-muted-bg focus:outline-none focus:ring-2 focus:ring-gwc-navy/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gwc-text-heading">
              Categories
            </label>
            <div className="flex flex-wrap gap-2 border border-gwc-border rounded-lg px-3 py-2 bg-gwc-muted-bg">
              {categories.map((c) => (
                <span
                  key={c}
                  className="flex items-center gap-1 bg-gwc-gold/30 text-gwc-gold-text text-xs px-2.5 py-1 rounded-full"
                >
                  {c}
                  <button type="button" onClick={() => removeCategory(c)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                value={categoryInput}
                onChange={(e) => {
                  const value = e.target.value;
                  // Turn it into a chip right away when a suggestion is picked
                  if (availableCategories.includes(value)) {
                    addCategory(value);
                  } else {
                    setCategoryInput(value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCategory(categoryInput);
                  }
                }}
                list="available-categories"
                placeholder="Search or create category..."
                className="flex-1 min-w-[120px] bg-transparent text-sm focus:outline-none py-1"
              />
              <datalist id="available-categories">
                {availableCategories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gwc-text-heading">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as MemberStatus)}
              className="border border-gwc-border rounded-lg px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gwc-navy/20"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="visitor">Visitor</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-gwc-text-body border border-gwc-border hover:bg-gwc-muted-bg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-gwc-navy text-white hover:brightness-110"
          >
            Save Member
          </button>
        </div>
      </div>
    </div>
  );
}
