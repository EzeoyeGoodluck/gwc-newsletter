"use client";

import { Plus } from "lucide-react";

import type { NewsletterTemplateDesign } from "@/lib/newsletter-template-presets";

export interface Template {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  updatedLabel: string;
  popular?: boolean;
  design?: NewsletterTemplateDesign | null;
  previewHtml?: string | null;
}

interface NewsletterTemplatesProps {
  templates: Template[];
  categoryFilter: string;
  availableCategories: string[];
  onCategoryFilterChange: (category: string) => void;
  onUseTemplate: (template: Template) => void;
  onCreateBlank: () => void;
}

interface TemplatePreviewProps {
  template: Template;
}

const CATEGORY_COLORS: Record<string, string> = {
  EVENTS: "bg-amber-50 text-amber-700",
  GENERAL: "bg-blue-50 text-blue-700",
  MINISTRY: "bg-purple-50 text-purple-700",
  ONBOARDING: "bg-green-50 text-green-700",
};

function TemplatePreview({ template }: TemplatePreviewProps) {
  const communityPhoto =
    "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1000&q=85";

  const volunteerPhoto =
    "https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1000&q=85";

  const presetCovers: Record<string, string> = {
    "gwc-preset-weekly-bulletin-v1": communityPhoto,
    "gwc-preset-event-announcement-v1": communityPhoto,
    "gwc-preset-ministry-update-v1": volunteerPhoto,
  };

  const category = template.category.trim().toUpperCase();

  const fallbackPhoto =
    category === "MINISTRY" ? volunteerPhoto : communityPhoto;

  const coverUrl =
    template.imageUrl?.trim() || presetCovers[template.id] || fallbackPhoto;

  return (
    <div className="relative h-[220px] w-full overflow-hidden border-b border-gwc-border/20 bg-[#F4F6F8]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={coverUrl}
        alt={`${template.title} cover`}
        loading="lazy"
        className="block h-full w-full object-cover object-center"
        onError={(event) => {
          const image = event.currentTarget;

          // Try one fallback without creating an error loop.
          if (image.dataset.fallbackAttempted === "true") return;

          image.dataset.fallbackAttempted = "true";
          image.src =
            coverUrl === communityPhoto ? volunteerPhoto : communityPhoto;
        }}
      />

      {template.popular && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-gwc-gold px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-gwc-gold-text shadow-sm">
          Popular
        </span>
      )}
    </div>
  );
}

export function NewsletterTemplates({
  templates,
  categoryFilter,
  availableCategories,
  onCategoryFilterChange,
  onUseTemplate,
  onCreateBlank,
}: NewsletterTemplatesProps) {
  const categoryOptions = Array.from(
    new Set([
      "All Categories",
      ...availableCategories.filter(Boolean),
      categoryFilter,
    ])
  );

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="font-gwc-heading text-[28px] font-semibold tracking-tight text-gwc-navy">
            Template Library
          </h1>

          <p className="mt-1 text-sm text-gwc-text-body">
            Choose a ready-to-edit newsletter for your next communication.
          </p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="sr-only">Filter templates by category</span>

          <select
            value={categoryFilter}
            onChange={(event) => onCategoryFilterChange(event.target.value)}
            className="min-w-[160px] cursor-pointer rounded-lg border border-gwc-border bg-white px-4 py-2.5 text-sm text-gwc-text-body outline-none transition-colors focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10"
          >
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </header>

      {templates.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => {
            const categoryColor =
              CATEGORY_COLORS[template.category.trim().toUpperCase()] ??
              "bg-gwc-muted-bg text-gwc-text-muted";

            return (
              <article
                key={template.id}
                className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-gwc-border/20 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <TemplatePreview template={template} />

                <div className="flex flex-1 flex-col p-5">
                  <span
                    className={`self-start rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${categoryColor}`}
                  >
                    {template.category}
                  </span>

                  <h2 className="mt-3 font-gwc-heading text-lg font-semibold leading-snug text-gwc-text-heading">
                    {template.title}
                  </h2>

                  <p className="mt-2 text-sm leading-relaxed text-gwc-text-body">
                    {template.description}
                  </p>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
                    <span className="text-xs text-gwc-text-muted">
                      {template.updatedLabel}
                    </span>

                    <button
                      type="button"
                      onClick={() => onUseTemplate(template)}
                      aria-label={`Use ${template.title} template`}
                      className="cursor-pointer rounded-lg bg-gwc-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gwc-navy focus-visible:ring-offset-2"
                    >
                      Use Template
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div
          role="status"
          className="rounded-xl border border-gwc-border/20 bg-white px-6 py-12 text-center"
        >
          <p className="text-sm font-semibold text-gwc-text-heading">
            No templates found
          </p>

          <p className="mt-2 text-sm text-gwc-text-muted">
            Choose another category or start with a blank template.
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onCreateBlank}
        className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-gwc-border/50 bg-white px-6 py-8 text-center transition-colors hover:border-gwc-navy/40 hover:bg-gwc-muted-bg/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gwc-navy focus-visible:ring-offset-2 sm:flex-row sm:text-left"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gwc-muted-bg">
          <Plus aria-hidden="true" className="h-5 w-5 text-gwc-text-muted" />
        </span>

        <span>
          <span className="block text-sm font-semibold text-gwc-text-heading">
            Start with a Blank Template
          </span>

          <span className="mt-1 block text-xs text-gwc-text-muted">
            Build your own newsletter using the content blocks.
          </span>
        </span>
      </button>
    </div>
  );
}
