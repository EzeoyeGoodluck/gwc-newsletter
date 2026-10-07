"use client";

import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  Copy,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import {
  BLOCK_DEFINITIONS,
  BLOCK_TYPES,
  blocksToText,
  renderNewsletter,
  type BlockType,
  type NewsletterBlock,
} from "@/lib/newsletter-blocks";

export interface NewsletterContent {
  subjectLine: string;
  headerImageUrl: string;
  bodyText: string;
  previewText?: string;
  blocks?: NewsletterBlock[];
}

interface CreateNewsletterStepThreeProps {
  campaignName: string;
  content: NewsletterContent;
  onContentChange: (content: NewsletterContent) => void;
  onBack: () => void;
  onSaveDraft: () => void;
  onSend: () => void;
  saving?: boolean;
}

const inputClass =
  "w-full rounded-lg border border-gwc-border/50 bg-gwc-muted-bg px-3 py-2.5 text-sm text-gwc-navy focus:outline-none focus:ring-2 focus:ring-gwc-navy/20";

const FIELD_LABELS: Record<string, string> = {
  text: "Greeting text",
  heading: "Heading",
  body: "Message",
  verse: "Verse text",
  reference: "Scripture reference",
  title: "Event title",
  date: "Date and time",
  location: "Location",
  description: "Description",
  label: "Button label",
  url: "URL",
  alt: "Image description",
};

function initialBlocks(content: NewsletterContent): NewsletterBlock[] {
  // Undefined means legacy content. An empty array means intentionally empty.
  if (content.blocks !== undefined) return content.blocks;

  return content.bodyText
    ? [
        {
          id: "legacy-body",
          type: "text",
          fields: { heading: "", body: content.bodyText },
        },
      ]
    : [];
}

export function CreateNewsletterStepThree({
  campaignName,
  content,
  onContentChange,
  onBack,
  onSaveDraft,
  onSend,
  saving = false,
}: CreateNewsletterStepThreeProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const blocks = initialBlocks(content);
  const selected = blocks.find((block) => block.id === selectedId);

  function updateContent<K extends keyof NewsletterContent>(
    key: K,
    value: NewsletterContent[K]
  ) {
    onContentChange({ ...content, [key]: value });
  }

  function commit(next: NewsletterBlock[]) {
    onContentChange({
      ...content,
      blocks: next,
      bodyText: blocksToText(next),
    });
  }

  function addBlock(type: BlockType) {
    const block: NewsletterBlock = {
      id: crypto.randomUUID(),
      type,
      fields: { ...BLOCK_DEFINITIONS[type].defaults },
    };

    commit([...blocks, block]);
    setSelectedId(block.id);
  }

  function updateField(key: string, value: string) {
    if (!selected) return;

    commit(
      blocks.map((block) =>
        block.id === selected.id
          ? { ...block, fields: { ...block.fields, [key]: value } }
          : block
      )
    );
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;

    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  }

  function duplicate(index: number) {
    const original = blocks[index];
    const duplicate: NewsletterBlock = {
      ...original,
      id: crypto.randomUUID(),
      fields: { ...original.fields },
    };
    const next = [...blocks];
    next.splice(index + 1, 0, duplicate);
    commit(next);
    setSelectedId(duplicate.id);
  }

  function remove(id: string) {
    commit(blocks.filter((block) => block.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  const preview = renderNewsletter(blocks, {
    subject: content.subjectLine || campaignName || "Sunday Bulletin",
    headerImageUrl: content.headerImageUrl,
    previewText: content.previewText,
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={onBack}
            disabled={saving}
            className="mb-2 flex items-center gap-1 text-sm text-gwc-text-muted disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Campaign Details
          </button>

          <h1 className="text-[28px] font-semibold text-gwc-navy">
            {campaignName || "Untitled Campaign"}
          </h1>
          <p className="mt-1 text-sm text-gwc-text-body">
            Step 3 of 4 — Editor & Build
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg border border-gwc-border/50 px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save Draft"}
          </button>

          <button
            type="button"
            onClick={onSend}
            disabled={saving || !content.subjectLine.trim()}
            className="rounded-lg bg-gwc-navy px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            Next: Review
          </button>
        </div>
      </header>

      <section className="grid gap-4 rounded-xl border border-gwc-border/20 bg-white p-5 md:grid-cols-3">
        <label className="flex flex-col gap-2 text-xs font-semibold">
          Subject line
          <input
            className={inputClass}
            value={content.subjectLine}
            onChange={(e) => updateContent("subjectLine", e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-2 text-xs font-semibold">
          Preview text
          <input
            className={inputClass}
            value={content.previewText ?? ""}
            onChange={(e) => updateContent("previewText", e.target.value)}
            placeholder="A short summary for the inbox"
          />
        </label>

        <label className="flex flex-col gap-2 text-xs font-semibold">
          Header image URL
          <input
            className={inputClass}
            value={content.headerImageUrl}
            onChange={(e) => updateContent("headerImageUrl", e.target.value)}
            placeholder="https://..."
          />
        </label>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="flex flex-col gap-5">
          <section className="rounded-xl border border-gwc-border/20 bg-white p-5">
            <h2 className="font-semibold text-gwc-navy">Content Blocks</h2>
            <p className="mb-4 mt-1 text-xs text-gwc-text-muted">
              Click a block to add it.
            </p>

            <div className="flex flex-col gap-2">
              {BLOCK_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => addBlock(type)}
                  disabled={blocks.length >= 100}
                  className="flex items-center justify-between rounded-lg border border-gwc-border/30 bg-gwc-muted-bg px-3 py-3 text-left text-sm hover:border-gwc-navy disabled:opacity-50"
                >
                  {BLOCK_DEFINITIONS[type].label}
                  <Plus className="h-4 w-4" />
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-gwc-border/20 bg-white p-5">
            <h2 className="mb-4 font-semibold text-gwc-navy">
              Newsletter Sections
            </h2>

            {!blocks.length && (
              <p className="text-sm text-gwc-text-muted">
                Add your first block above.
              </p>
            )}

            <div className="flex flex-col gap-2">
              {blocks.map((block, index) => (
                <div
                  key={block.id}
                  className={`rounded-lg border p-3 ${
                    selectedId === block.id
                      ? "border-gwc-navy bg-gwc-navy/5"
                      : "border-gwc-border/30"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(block.id)}
                    className="w-full text-left text-sm font-semibold"
                  >
                    {index + 1}. {BLOCK_DEFINITIONS[block.type].label}
                  </button>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      title="Move up"
                      aria-label="Move section up"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      className="rounded p-1 hover:bg-gwc-muted-bg disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="Move down"
                      aria-label="Move section down"
                      disabled={index === blocks.length - 1}
                      onClick={() => move(index, 1)}
                      className="rounded p-1 hover:bg-gwc-muted-bg disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="Duplicate"
                      aria-label="Duplicate section"
                      disabled={blocks.length >= 100}
                      onClick={() => duplicate(index)}
                      className="rounded p-1 hover:bg-gwc-muted-bg disabled:opacity-30"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      title="Remove"
                      aria-label="Remove section"
                      onClick={() => remove(block.id)}
                      className="ml-auto rounded p-1 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {selected && (
            <section className="rounded-xl border border-gwc-border/20 bg-white p-5">
              <h2 className="mb-4 font-semibold text-gwc-navy">
                Edit {BLOCK_DEFINITIONS[selected.type].label}
              </h2>

              {selected.type === "divider" ? (
                <p className="text-sm text-gwc-text-muted">
                  This block adds a horizontal separator.
                </p>
              ) : (
                <div className="flex flex-col gap-4">
                  {Object.entries(selected.fields).map(([key, value]) => (
                    <label
                      key={key}
                      className="flex flex-col gap-2 text-xs font-semibold"
                    >
                      {FIELD_LABELS[key] ?? key}

                      {["body", "verse", "description"].includes(key) ? (
                        <textarea
                          rows={5}
                          className={inputClass}
                          value={value}
                          onChange={(e) => updateField(key, e.target.value)}
                        />
                      ) : (
                        <input
                          className={inputClass}
                          value={value}
                          onChange={(e) => updateField(key, e.target.value)}
                          placeholder={key === "url" ? "https://..." : ""}
                        />
                      )}
                    </label>
                  ))}
                </div>
              )}

              {selected.type === "greeting" && (
                <p className="mt-3 text-xs text-gwc-text-muted">
                  {"{{memberName}}"} is a placeholder; delivery personalization
                  must be connected in the sender.
                </p>
              )}
            </section>
          )}
        </aside>

        <section className="overflow-hidden rounded-xl border border-gwc-border/20 bg-white shadow-sm">
          <div className="border-b border-gwc-border/20 px-5 py-4">
            <h2 className="font-semibold text-gwc-navy">Live Preview</h2>
            <p className="mt-1 text-xs text-gwc-text-muted">
              Select a section on the left to edit it.
            </p>
          </div>

          <iframe
            title="Newsletter preview"
            srcDoc={preview}
            sandbox=""
            referrerPolicy="no-referrer"
            className="h-[950px] w-full border-0 bg-gwc-muted-bg"
          />
        </section>
      </div>
    </div>
  );
}
