"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  CalendarDays,
  ChevronLeft,
  CircleDollarSign,
  Copy,
  Globe,
  Heart,
  ImageIcon,
  Link2,
  Mail,
  MapPin,
  Minus,
  MousePointer2,
  Plus,
  Quote,
  Settings2,
  Share2,
  Trash2,
  Type,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import {
  BLOCK_DEFINITIONS,
  BLOCK_TYPES,
  blocksToText,
  renderNewsletter,
  safeUrl,
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
  onCampaignNameChange?: (name: string) => void;
  content: NewsletterContent;
  onContentChange: (content: NewsletterContent) => void;
  onBack: () => void;
  onSaveDraft: () => void;
  onSend: () => void;
  saving?: boolean;
}

interface InlineTextProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  disabled: boolean;
  className?: string;
}

const MAX_BLOCKS = 100;

const BLOCK_ICONS: Record<BlockType, LucideIcon> = {
  greeting: UserRound,
  text: Type,
  scripture: BookOpen,
  event: CalendarDays,
  giving: CircleDollarSign,
  button: MousePointer2,
  image: ImageIcon,
  divider: Minus,
  footer: Mail,
};

const BLOCK_LABELS: Record<BlockType, string> = {
  greeting: "Greeting",
  text: "Heading & Body",
  scripture: "Scripture Quote",
  event: "Events Schedule",
  giving: "Giving",
  button: "CTA Button",
  image: "Image Banner",
  divider: "Divider",
  footer: "Footer",
};

const FOOTER_DESTINATIONS = [
  {
    key: "socialUrl",
    label: "Social page",
    Icon: Share2,
  },
  {
    key: "websiteUrl",
    label: "Church website",
    Icon: Globe,
  },
  {
    key: "contactUrl",
    label: "Contact page",
    Icon: Mail,
  },
] as const;

const inputClass =
  "w-full min-w-0 rounded-md border border-[#E3E6EA] bg-[#F4F5F7] px-3 py-2 text-xs text-[#002B3D] outline-none focus:border-[#002B3D] focus:ring-2 focus:ring-[#002B3D]/10 disabled:cursor-not-allowed disabled:opacity-60";

function InlineText({
  value,
  onChange,
  label,
  placeholder,
  disabled,
  className = "",
}: InlineTextProps) {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const element = ref.current;

    if (!element) return;

    function resize() {
      if (!element) return;

      element.style.height = "0px";
      element.style.height = `${element.scrollHeight}px`;
    }

    resize();

    let lastWidth = element.clientWidth;

    const observer = new ResizeObserver(() => {
      if (element.clientWidth !== lastWidth) {
        lastWidth = element.clientWidth;
        resize();
      }
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [value, placeholder]);

  return (
    <textarea
      ref={ref}
      rows={1}
      aria-label={label}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={20_000}
      onChange={(event) => onChange(event.target.value)}
      className={`block w-full resize-none overflow-hidden rounded-sm border-0 bg-transparent p-1 outline-none placeholder:text-slate-400 hover:ring-1 hover:ring-slate-200 focus:ring-2 focus:ring-[#E9C34A]/60 disabled:cursor-not-allowed ${className}`}
    />
  );
}

function initialBlocks(content: NewsletterContent): NewsletterBlock[] {
  if (content.blocks !== undefined) {
    return content.blocks;
  }

  return content.bodyText
    ? [
        {
          id: "legacy-body",
          type: "text",
          fields: {
            heading: "",
            body: content.bodyText,
          },
        },
      ]
    : [];
}

function footerLast(blocks: NewsletterBlock[]): NewsletterBlock[] {
  return [
    ...blocks.filter((block) => block.type !== "footer"),
    ...blocks.filter((block) => block.type === "footer"),
  ];
}

export function CreateNewsletterStepThree({
  campaignName,
  onCampaignNameChange,
  content,
  onContentChange,
  onBack,
  onSaveDraft,
  onSend,
  saving = false,
}: CreateNewsletterStepThreeProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [canvasMode, setCanvasMode] = useState<"edit" | "preview">("edit");

  const blocks = footerLast(initialBlocks(content));
  const headerUrl = safeUrl(content.headerImageUrl);

  const sidebarTypes = [
    ...BLOCK_TYPES.filter((type) => type !== "footer"),
    ...BLOCK_TYPES.filter((type) => type === "footer"),
  ];

  function updateContent<K extends keyof NewsletterContent>(
    key: K,
    value: NewsletterContent[K]
  ) {
    if (saving) return;

    onContentChange({
      ...content,
      [key]: value,
    });
  }

  function commit(nextBlocks: NewsletterBlock[]) {
    if (saving) return;

    const orderedBlocks = footerLast(nextBlocks);

    onContentChange({
      ...content,
      blocks: orderedBlocks,
      bodyText: blocksToText(orderedBlocks),
    });
  }

  function addBlock(type: BlockType) {
    if (saving) return;

    if (type === "footer") {
      const existingFooter = blocks.find((block) => block.type === "footer");

      if (existingFooter) {
        setSelectedId(existingFooter.id);
        setCanvasMode("edit");
        return;
      }
    }

    if (blocks.length >= MAX_BLOCKS) return;

    const block: NewsletterBlock = {
      id: crypto.randomUUID(),
      type,
      fields: {
        ...BLOCK_DEFINITIONS[type].defaults,
      },
    };

    const nextBlocks = [...blocks];
    const footerIndex = nextBlocks.findIndex((item) => item.type === "footer");

    if (type !== "footer" && footerIndex >= 0) {
      nextBlocks.splice(footerIndex, 0, block);
    } else {
      nextBlocks.push(block);
    }

    commit(nextBlocks);
    setSelectedId(block.id);
    setCanvasMode("edit");
  }

  function updateField(id: string, key: string, value: string) {
    if (saving) return;

    commit(
      blocks.map((block) =>
        block.id === id
          ? {
              ...block,
              fields: {
                ...block.fields,
                [key]: value,
              },
            }
          : block
      )
    );
  }

  function move(index: number, direction: -1 | 1) {
    if (saving) return;

    const target = index + direction;
    const original = blocks[index];
    const other = blocks[target];

    if (
      !original ||
      !other ||
      original.type === "footer" ||
      other.type === "footer"
    ) {
      return;
    }

    const nextBlocks = [...blocks];
    nextBlocks[index] = other;
    nextBlocks[target] = original;

    commit(nextBlocks);
    setSelectedId(original.id);
  }

  function duplicate(index: number) {
    if (saving || blocks.length >= MAX_BLOCKS) return;

    const original = blocks[index];

    if (!original || original.type === "footer") return;

    const duplicatedBlock: NewsletterBlock = {
      ...original,
      id: crypto.randomUUID(),
      fields: {
        ...original.fields,
      },
    };

    const nextBlocks = [...blocks];
    nextBlocks.splice(index + 1, 0, duplicatedBlock);

    commit(nextBlocks);
    setSelectedId(duplicatedBlock.id);
    setCanvasMode("edit");
  }

  function remove(id: string) {
    if (saving) return;

    commit(blocks.filter((block) => block.id !== id));

    if (selectedId === id) {
      setSelectedId(null);
    }
  }

  function textField(
    block: NewsletterBlock,
    key: string,
    label: string,
    className: string,
    placeholder = label
  ) {
    return (
      <InlineText
        value={block.fields[key] ?? ""}
        label={label}
        placeholder={placeholder}
        disabled={saving}
        className={className}
        onChange={(value) => updateField(block.id, key, value)}
      />
    );
  }

  function renderEditableBlock(block: NewsletterBlock) {
    const field = block.fields;
    const selected = selectedId === block.id;

    switch (block.type) {
      case "greeting":
        return (
          <div className="rounded-lg bg-[#F8FAFB] px-4 py-3">
            {textField(
              block,
              "text",
              "Greeting text",
              "text-lg font-semibold leading-7 text-[#002B3D]",
              "Hi {{memberName}},"
            )}

            {selected && (
              <p className="mt-2 text-[10px] text-slate-500">
                Keep {"{{memberName}}"} for recipient personalization.
              </p>
            )}
          </div>
        );

      case "text":
        return (
          <div className="rounded-lg bg-[#F8FAFB] px-4 py-3">
            {textField(
              block,
              "heading",
              "Heading",
              "text-base font-semibold leading-6 text-[#002B3D]"
            )}

            {textField(
              block,
              "body",
              "Message",
              "mt-1 text-sm leading-7 text-slate-700",
              "Write your announcement here..."
            )}
          </div>
        );

      case "scripture":
        return (
          <div
            className="rounded-lg border border-dashed border-[#B79C42] px-4 py-4"
            style={{
              background:
                "linear-gradient(120deg, #DCE5E8 0%, #C3D1D9 48%, #AEBFCB 100%)",
            }}
          >
            <div className="flex items-start gap-2">
              <Quote
                className="mt-1.5 h-4 w-4 shrink-0 text-[#8A7427]"
                aria-hidden="true"
              />

              <div className="min-w-0 flex-1">
                {textField(
                  block,
                  "verse",
                  "Verse text",
                  "text-[13px] leading-6 text-[#193A4B]",
                  "Add your Bible verse here."
                )}

                {textField(
                  block,
                  "reference",
                  "Scripture reference",
                  "mt-1 text-[10px] font-semibold uppercase tracking-wide text-[#806B24]"
                )}
              </div>
            </div>
          </div>
        );

      case "event":
        return (
          <div className="rounded-lg bg-[#F4F6F8] px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-[#FFE58C] p-2">
                <CalendarDays className="h-4 w-4 text-[#80691D]" />
              </div>

              <div className="min-w-0 flex-1">
                {textField(
                  block,
                  "title",
                  "Event title",
                  "text-base font-semibold text-[#002B3D]"
                )}

                <div className="mt-2 flex items-start gap-2">
                  <CalendarDays className="mt-2 h-3.5 w-3.5 shrink-0 text-slate-500" />

                  {textField(
                    block,
                    "date",
                    "Date and time",
                    "text-xs leading-6 text-slate-600"
                  )}
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="mt-2 h-3.5 w-3.5 shrink-0 text-slate-500" />

                  {textField(
                    block,
                    "location",
                    "Location",
                    "text-xs leading-6 text-slate-600"
                  )}
                </div>

                {textField(
                  block,
                  "description",
                  "Event description",
                  "mt-2 text-sm leading-7 text-slate-700",
                  "Add event details..."
                )}
              </div>
            </div>
          </div>
        );

      case "giving":
        return (
          <div className="rounded-lg bg-[#E8E9EC] px-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="mt-1 rounded-full bg-[#FFDC64] p-2">
                  <CircleDollarSign
                    className="h-4 w-4 text-[#91761D]"
                    aria-hidden="true"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  {textField(
                    block,
                    "title",
                    "Giving title",
                    "text-[12px] font-semibold text-[#002B3D]"
                  )}

                  {textField(
                    block,
                    "description",
                    "Giving description",
                    "text-[11px] leading-5 text-slate-600"
                  )}
                </div>
              </div>

              <div className="flex w-full items-center gap-1.5 rounded-md bg-[#002B3D] px-3 py-1.5 text-white sm:w-[180px] sm:shrink-0">
                <Heart className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />

                {textField(
                  block,
                  "buttonLabel",
                  "Giving button label",
                  "text-center text-[10px] font-medium text-white",
                  "Give Securely Online"
                )}
              </div>
            </div>

            {(selected || !safeUrl(field.url ?? "")) && (
              <label className="mt-3 block text-[11px] text-slate-500">
                Giving page URL
                <input
                  type="text"
                  value={field.url ?? ""}
                  disabled={saving}
                  maxLength={20_000}
                  placeholder="https://..."
                  className={`${inputClass} mt-1`}
                  onChange={(event) =>
                    updateField(block.id, "url", event.target.value)
                  }
                />
              </label>
            )}

            {selected && field.url && !safeUrl(field.url) && (
              <p className="mt-1 text-xs text-amber-700">
                Enter a complete http:// or https:// giving link.
              </p>
            )}
          </div>
        );

      case "button":
        return (
          <div className="rounded-lg bg-[#F8FAFB] px-4 py-5">
            <div className="mx-auto flex max-w-[230px] items-center gap-2 rounded-lg bg-[#FFD85B] px-4 py-2 text-[#66500F]">
              <MousePointer2 className="h-4 w-4 shrink-0" />

              {textField(
                block,
                "label",
                "Button label",
                "text-center text-sm font-semibold",
                "Register Now"
              )}
            </div>

            {(selected || !safeUrl(field.url ?? "")) && (
              <div className="mt-3">
                <label className="block text-xs text-slate-500">
                  <span className="mb-1 flex items-center gap-1">
                    <Link2 className="h-3.5 w-3.5" />
                    Button link
                  </span>

                  <input
                    type="text"
                    value={field.url ?? ""}
                    disabled={saving}
                    maxLength={20_000}
                    placeholder="https://..."
                    className={inputClass}
                    onChange={(event) =>
                      updateField(block.id, "url", event.target.value)
                    }
                  />
                </label>

                {field.url && !safeUrl(field.url) && (
                  <p className="mt-1 text-xs text-amber-700">
                    Enter a complete http:// or https:// link.
                  </p>
                )}
              </div>
            )}
          </div>
        );

      case "image": {
        const url = safeUrl(field.url ?? "");

        return (
          <div className="overflow-hidden rounded-lg bg-[#F8FAFB]">
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={field.alt ?? ""}
                referrerPolicy="no-referrer"
                className="block h-auto w-full"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-slate-200 px-4 py-10 text-slate-400">
                <ImageIcon className="h-8 w-8" />
                <span className="text-sm">Add an image URL below</span>
              </div>
            )}

            {(selected || !url) && (
              <div className="space-y-3 p-3">
                <label className="block text-xs text-slate-500">
                  Image URL
                  <input
                    type="text"
                    value={field.url ?? ""}
                    disabled={saving}
                    maxLength={20_000}
                    placeholder="https://..."
                    className={`${inputClass} mt-1`}
                    onChange={(event) =>
                      updateField(block.id, "url", event.target.value)
                    }
                  />
                </label>

                <label className="block text-xs text-slate-500">
                  Image description
                  <input
                    type="text"
                    value={field.alt ?? ""}
                    disabled={saving}
                    maxLength={20_000}
                    placeholder="Describe this image"
                    className={`${inputClass} mt-1`}
                    onChange={(event) =>
                      updateField(block.id, "alt", event.target.value)
                    }
                  />
                </label>

                {field.url && !url && (
                  <p className="text-xs text-amber-700">
                    Enter a complete http:// or https:// image URL.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      }

      case "divider":
        return (
          <div className="px-2 py-5">
            <hr className="border-slate-200" />
          </div>
        );

      case "footer":
        return (
          <div className="px-3 py-4 text-center">
            <div className="mb-2 flex items-center justify-center gap-3 text-[#8C9298]">
              {FOOTER_DESTINATIONS.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  aria-label={`Edit ${label.toLowerCase()} link`}
                  title={
                    safeUrl(field[key] ?? "")
                      ? `${label} configured`
                      : `Configure ${label.toLowerCase()}`
                  }
                  disabled={saving}
                  onClick={() => setSelectedId(block.id)}
                  className="rounded p-1 hover:bg-slate-100 disabled:opacity-50"
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>

            <div className="flex flex-col items-center justify-center sm:flex-row">
              <div className="w-full sm:w-[45%]">
                {textField(
                  block,
                  "churchName",
                  "Church name",
                  "text-center text-[10px] font-medium leading-4 text-[#5D6268]",
                  "Glory Worship Church"
                )}
              </div>

              <span
                className="hidden text-[10px] text-slate-400 sm:block"
                aria-hidden="true"
              >
                ·
              </span>

              <div className="min-w-0 w-full sm:flex-1">
                {textField(
                  block,
                  "address",
                  "Church address",
                  "text-center text-[10px] leading-4 text-[#5D6268]",
                  "Enter your church address"
                )}
              </div>
            </div>

            {textField(
              block,
              "notice",
              "Subscription notice",
              "mt-1 text-center text-[9px] leading-4 text-[#9A9FA5]"
            )}

            <div className="mx-auto flex max-w-[270px] items-center justify-center gap-1">
              <div className="min-w-0 flex-1">
                {textField(
                  block,
                  "preferencesLabel",
                  "Manage preferences label",
                  "text-center text-[9px] leading-4 text-[#91969C] underline"
                )}
              </div>

              <span className="text-[9px] text-slate-300">·</span>

              <div className="min-w-0 flex-1">
                {textField(
                  block,
                  "unsubscribeLabel",
                  "Unsubscribe label",
                  "text-center text-[9px] leading-4 text-[#91969C] underline"
                )}
              </div>
            </div>

            {selected && (
              <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3 text-left">
                <p className="text-[10px] font-medium text-slate-500">
                  Footer link settings — editor only
                </p>

                {FOOTER_DESTINATIONS.map(({ key, label }) => {
                  const value = field[key] ?? "";

                  return (
                    <label
                      key={key}
                      className="block text-[10px] text-slate-500"
                    >
                      {label}
                      <input
                        type="text"
                        value={value}
                        disabled={saving}
                        maxLength={20_000}
                        placeholder="https://..."
                        className={`${inputClass} mt-1`}
                        onChange={(event) =>
                          updateField(block.id, key, event.target.value)
                        }
                      />

                      {value && !safeUrl(value) && (
                        <span className="mt-1 block text-[10px] text-amber-700">
                          Enter a complete http:// or https:// URL.
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
    }
  }

  const preview = renderNewsletter(blocks, {
    subject: content.subjectLine || campaignName || "Newsletter",
    headerImageUrl: content.headerImageUrl,
    previewText: content.previewText,
  });

  return (
    <div
      className="space-y-5 text-[#002B3D]"
      onClick={(event) => {
        const target = event.target;

        if (!(target instanceof Element)) return;

        if (
          target.closest("[data-newsletter-block]") ||
          target.closest("button, input, textarea, select, label, a")
        ) {
          return;
        }

        setSelectedId(null);
      }}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={onBack}
            disabled={saving}
            className="mb-2 flex items-center gap-1 text-xs text-slate-500 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Templates
          </button>

          <h1 className="text-2xl font-semibold">
            {campaignName || "Untitled Campaign"}
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            Step 2 of 3 — Editor &amp; Build
          </p>
        </div>

        <div
          role="group"
          aria-label="Editor display mode"
          className="flex rounded-lg border border-slate-200 bg-white p-1"
        >
          {(["edit", "preview"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setCanvasMode(mode)}
              aria-pressed={canvasMode === mode}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                canvasMode === mode
                  ? "bg-[#002B3D] text-white"
                  : "text-slate-500"
              }`}
            >
              {mode === "edit" ? "Edit" : "Preview"}
            </button>
          ))}
        </div>
      </header>

      <section className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold">
          <Settings2 className="h-3.5 w-3.5" />
          Campaign Details
        </h2>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="text-[11px] font-medium">
            Internal Title
            <input
              type="text"
              value={campaignName}
              disabled={saving}
              readOnly={!onCampaignNameChange}
              className={`${inputClass} mt-1.5`}
              placeholder="Sunday Bulletin"
              onChange={(event) => {
                if (saving) return;

                onCampaignNameChange?.(event.target.value);
              }}
            />
          </label>

          <label className="text-[11px] font-medium">
            Email Subject Line
            <input
              type="text"
              value={content.subjectLine}
              disabled={saving}
              className={`${inputClass} mt-1.5`}
              placeholder="Join us this Sunday!"
              onChange={(event) =>
                updateContent("subjectLine", event.target.value)
              }
            />
          </label>

          <label className="text-[11px] font-medium">
            Preview Text
            <input
              type="text"
              value={content.previewText ?? ""}
              disabled={saving}
              className={`${inputClass} mt-1.5`}
              placeholder="Service starts at 10AM."
              onChange={(event) =>
                updateContent("previewText", event.target.value)
              }
            />
          </label>
        </div>
      </section>

      <div className="grid items-stretch gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={saving}
              className="rounded-md border border-[#002B3D]/50 bg-white px-3 py-2 text-[11px] font-medium text-[#002B3D] disabled:opacity-50"
            >
              {saving ? "Please wait…" : "Save Draft"}
            </button>

            <button
              type="button"
              onClick={onSend}
              disabled={saving || !content.subjectLine.trim()}
              className="rounded-md bg-[#002B3D] px-3 py-2 text-[11px] font-medium text-white disabled:opacity-50"
            >
              Next Step
            </button>
          </div>

          <h2 className="text-sm font-semibold">Content Blocks</h2>

          <p className="mb-5 mt-1 text-[11px] text-slate-500">
            Click to add. Edit text in the canvas.
          </p>

          <div className="space-y-2">
            {sidebarTypes.map((type) => {
              const Icon = BLOCK_ICONS[type];
              const active = blocks.some((block) => block.type === type);

              const canSelectExistingFooter = type === "footer" && active;

              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => addBlock(type)}
                  disabled={
                    saving ||
                    (blocks.length >= MAX_BLOCKS && !canSelectExistingFooter)
                  }
                  className="flex w-full items-center gap-2 rounded-md border border-[#E3E6EA] bg-[#F4F5F7] px-2.5 py-2 text-left text-[11px] text-[#333A42] transition-colors hover:border-[#002B3D]/40 disabled:opacity-50"
                >
                  <Icon
                    aria-hidden="true"
                    className={`h-4 w-4 shrink-0 ${
                      type === "scripture" ? "text-[#9A8229]" : "text-slate-600"
                    }`}
                  />

                  <span className="flex-1">
                    {BLOCK_LABELS[type]}

                    {type === "greeting" && (
                      <span className="block text-[10px] text-slate-500">
                        (Personalized)
                      </span>
                    )}
                  </span>

                  {active && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${
                        type === "scripture"
                          ? "bg-[#FFE589] text-[#7C6419]"
                          : "bg-[#DEEDF9] text-[#315B79]"
                      }`}
                    >
                      Active
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <p className="mt-5 text-[10px] text-slate-400">
            {blocks.length} / {MAX_BLOCKS} blocks
          </p>
        </aside>

        <section className="min-w-0 rounded-xl border border-slate-100 bg-white p-3 shadow-sm sm:p-5">
          {canvasMode === "preview" ? (
            <iframe
              title="Rendered newsletter preview"
              srcDoc={preview}
              sandbox=""
              referrerPolicy="no-referrer"
              className="h-[950px] w-full border-0 bg-[#F4F6F8]"
            />
          ) : (
            <div className="mx-auto max-w-[600px] overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm">
              <div className="bg-[#002B3D] px-6 py-7 text-center text-white">
                <h2 className="text-2xl font-semibold">Glory Worship Church</h2>

                <p className="mt-2 text-xs text-white/80">
                  {content.subjectLine || "Newsletter"}
                </p>
              </div>

              {headerUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={headerUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="block h-auto w-full"
                />
              )}

              <div className="space-y-4 px-4 py-5 sm:px-6">
                {blocks.length === 0 && (
                  <div className="rounded-lg border-2 border-dashed border-slate-200 px-4 py-16 text-center">
                    <Plus className="mx-auto mb-3 h-7 w-7 text-slate-400" />

                    <p className="text-sm font-medium">
                      Add your first content block
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      Choose a block from the left.
                    </p>
                  </div>
                )}

                {blocks.map((block, index) => {
                  const selected = selectedId === block.id;
                  const isFooter = block.type === "footer";

                  const previous = blocks[index - 1];
                  const next = blocks[index + 1];

                  const canMoveUp =
                    !saving &&
                    !isFooter &&
                    previous !== undefined &&
                    previous.type !== "footer";

                  const canMoveDown =
                    !saving &&
                    !isFooter &&
                    next !== undefined &&
                    next.type !== "footer";

                  return (
                    <article
                      key={block.id}
                      data-newsletter-block={block.id}
                      tabIndex={0}
                      aria-label={`${BLOCK_LABELS[block.type]} block`}
                      onFocusCapture={() => setSelectedId(block.id)}
                      onClick={() => setSelectedId(block.id)}
                      className={`group relative rounded-lg outline-none ${
                        selected
                          ? "ring-1 ring-[#D5B34D]"
                          : "hover:ring-1 hover:ring-slate-200"
                      }`}
                    >
                      <div
                        role="group"
                        aria-label={`${BLOCK_LABELS[block.type]} controls`}
                        className={`absolute right-1 top-0 z-10 flex -translate-y-1/2 gap-0.5 rounded-md border border-slate-200 bg-white p-0.5 shadow-sm ${
                          selected
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                        }`}
                      >
                        {!isFooter && (
                          <>
                            <button
                              type="button"
                              aria-label="Move block up"
                              title="Move up"
                              disabled={!canMoveUp}
                              onClick={(event) => {
                                event.stopPropagation();
                                move(index, -1);
                              }}
                              className="rounded p-1 hover:bg-slate-100 disabled:opacity-30"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              aria-label="Move block down"
                              title="Move down"
                              disabled={!canMoveDown}
                              onClick={(event) => {
                                event.stopPropagation();
                                move(index, 1);
                              }}
                              className="rounded p-1 hover:bg-slate-100 disabled:opacity-30"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>

                            <button
                              type="button"
                              aria-label="Duplicate block"
                              title="Duplicate"
                              disabled={saving || blocks.length >= MAX_BLOCKS}
                              onClick={(event) => {
                                event.stopPropagation();
                                duplicate(index);
                              }}
                              className="rounded p-1 hover:bg-slate-100 disabled:opacity-30"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          aria-label="Remove block"
                          title="Remove"
                          disabled={saving}
                          onClick={(event) => {
                            event.stopPropagation();
                            remove(block.id);
                          }}
                          className="rounded p-1 text-red-600 hover:bg-red-50 disabled:opacity-30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {renderEditableBlock(block)}
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
