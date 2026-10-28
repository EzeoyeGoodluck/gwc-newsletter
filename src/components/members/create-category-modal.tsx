"use client";

import { useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";

export interface Category {
  name: string;
  description: string;
  isPublicSignup?: boolean;
}

interface CreateCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (category: Category) => void | boolean | Promise<void | boolean>;
}

export function CreateCategoryModal({
  open,
  onClose,
  onCreate,
}: CreateCategoryModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublicSignup, setIsPublicSignup] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const submittingRef = useRef(false);

  if (!open) return null;

  function closeModal() {
    if (submittingRef.current) return;
    setName("");
    setDescription("");
    setIsPublicSignup(false);
    setError("");
    onClose();
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    if (!name.trim()) {
      setError("Please enter a category name.");
      return;
    }
    submittingRef.current = true;
    setPending(true);
    setError("");
    try {
      const saved = await onCreate({
        name: name.trim(),
        description: description.trim(),
        isPublicSignup,
      });
      if (saved === false) {
        setError(
          "The category was not created. Check the page error and try again."
        );
        return;
      }
      setName("");
      setDescription("");
      setIsPublicSignup(false);
      onClose();
    } catch {
      setError(
        "The save could not be confirmed. Check the category list before trying again."
      );
    } finally {
      submittingRef.current = false;
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-category-title"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-8 shadow-xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2
            id="create-category-title"
            className="text-xl font-semibold text-gwc-navy"
          >
            Create New Category
          </h2>
          <button
            type="button"
            onClick={closeModal}
            disabled={pending}
            aria-label="Close category form"
            className="text-gwc-text-muted hover:text-gwc-text-heading disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleCreate} aria-busy={pending}>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="category-name"
                className="text-sm font-medium text-gwc-text-heading"
              >
                Category Name <span className="text-red-500">*</span>
              </label>
              <input
                id="category-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                maxLength={120}
                disabled={pending}
                placeholder="e.g., Choir, Youth, Volunteers"
                className="rounded-lg border border-gwc-border bg-gwc-muted-bg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gwc-navy/20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="category-description"
                className="text-sm font-medium text-gwc-text-heading"
              >
                Description
              </label>
              <textarea
                id="category-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={2000}
                disabled={pending}
                rows={3}
                placeholder="Describe this category."
                className="resize-none rounded-lg border border-gwc-border bg-gwc-muted-bg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gwc-navy/20"
              />
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gwc-border bg-gwc-muted-bg p-4">
              <input
                type="checkbox"
                checked={isPublicSignup}
                onChange={(event) => setIsPublicSignup(event.target.checked)}
                disabled={pending}
                className="mt-1 h-4 w-4 shrink-0 accent-[#002B3D]"
              />
              <span>
                <span className="block text-sm font-medium text-gwc-text-heading">
                  Show on public registration
                </span>
                <span className="mt-1 block text-xs leading-5 text-gwc-text-muted">
                  Let people choose this category when registering. This does
                  not automatically add anyone to it.
                </span>
              </span>
            </label>
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}
          </div>
          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeModal}
              disabled={pending}
              className="rounded-lg border border-gwc-border px-5 py-2.5 text-sm font-medium text-gwc-text-body hover:bg-gwc-muted-bg disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending || !name.trim()}
              className="rounded-lg bg-gwc-navy px-5 py-2.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50"
            >
              {pending ? "Creating…" : "Create Category"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
