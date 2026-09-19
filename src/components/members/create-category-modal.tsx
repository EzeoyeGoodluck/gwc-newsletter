"use client";

import { useState } from "react";
import { X } from "lucide-react";

export interface Category {
  name: string;
  description: string;
}

interface CreateCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (category: Category) => void;
}

export function CreateCategoryModal({
  open,
  onClose,
  onCreate,
}: CreateCategoryModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  if (!open) return null;

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), description: description.trim() });
    setName("");
    setDescription("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gwc-navy">
            Create New Category
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
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Choir, Youth, Volunteers"
              className="border border-gwc-border rounded-lg px-4 py-3 text-sm bg-gwc-muted-bg focus:outline-none focus:ring-2 focus:ring-gwc-navy/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gwc-text-heading">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Members involved in the church choir or musical worship."
              rows={3}
              className="border border-gwc-border rounded-lg px-4 py-3 text-sm bg-gwc-muted-bg resize-none focus:outline-none focus:ring-2 focus:ring-gwc-navy/20"
            />
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
            onClick={handleCreate}
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-gwc-navy text-white hover:brightness-110"
          >
            Create Category
          </button>
        </div>
      </div>
    </div>
  );
}
