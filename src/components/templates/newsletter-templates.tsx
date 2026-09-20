"use client";

import { useState } from "react";
import { Plus, ChevronDown } from "lucide-react";

export interface Template {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  updatedLabel: string;
  popular?: boolean;
}

interface NewsletterTemplatesProps {
  templates: Template[];
  categoryFilter: string;
  availableCategories: string[];
  onCategoryFilterChange: (category: string) => void;
  onUseTemplate: (template: Template) => void;
  onCreateBlank: () => void;
}

const categoryColors: Record<string, string> = {
  EVENTS: "text-amber-600",
  GENERAL: "text-blue-600",
  MINISTRY: "text-purple-600",
  ONBOARDING: "text-green-600",
};

export function NewsletterTemplates({
  templates,
  categoryFilter,
  availableCategories,
  onCategoryFilterChange,
  onUseTemplate,
  onCreateBlank,
}: NewsletterTemplatesProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const categoryOptions = ["All Categories", ...availableCategories];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="flex flex-col gap-1">
          <h1 className="text-[28px] font-semibold text-gwc-navy tracking-tight">
            Template Library
          </h1>
          <p className="text-sm text-gwc-text-body">
            Choose a starting point for your next communication.
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => setFilterOpen((v) => !v)}
            className="flex items-center gap-2 bg-white border border-gwc-border rounded-lg px-4 py-2.5 text-sm text-gwc-text-body cursor-pointer hover:bg-gwc-muted-bg transition-colors"
          >
            {categoryFilter}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {filterOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setFilterOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white rounded-md shadow-lg border border-gwc-border/20 py-1">
                {categoryOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      onCategoryFilterChange(option);
                      setFilterOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-gwc-text-body hover:bg-gwc-muted-bg cursor-pointer"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {templates.map((template) => (
          <div
            key={template.id}
            className="flex flex-col bg-white rounded-xl border border-gwc-border/20 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="relative h-36 w-full overflow-hidden bg-gwc-border/20">
              <img
                src={template.imageUrl}
                alt={template.title}
                className="h-full w-full object-cover"
              />
              {template.popular && (
                <div className="absolute top-3 left-0 bg-gwc-gold text-gwc-gold-text text-[11px] font-bold tracking-wide uppercase px-3 py-1 rounded-r-full shadow-sm">
                  Popular
                </div>
              )}
            </div>
            <div className="flex flex-col justify-between flex-1 px-5 py-4">
              <div className="flex flex-col gap-1.5">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wide ${
                    categoryColors[template.category.toUpperCase()] ??
                    "text-gwc-text-muted"
                  }`}
                >
                  {template.category}
                </span>
                <h3 className="text-base font-semibold text-gwc-text-heading leading-snug">
                  {template.title}
                </h3>
                <p className="text-[13px] text-gwc-text-body leading-relaxed">
                  {template.description}
                </p>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-[12px] text-gwc-text-muted">
                  {template.updatedLabel}
                </span>
                <button
                  onClick={() => onUseTemplate(template)}
                  className="text-sm font-semibold text-gwc-navy cursor-pointer hover:underline"
                >
                  Use
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={onCreateBlank}
          className="flex flex-col items-center justify-center gap-3 bg-white rounded-xl border-2 border-dashed border-gwc-border/50 min-h-[260px] px-6 py-10 cursor-pointer hover:border-gwc-navy/40 hover:bg-gwc-muted-bg/30 transition-colors"
        >
          <div className="h-12 w-12 rounded-full bg-gwc-muted-bg flex items-center justify-center">
            <Plus className="h-5 w-5 text-gwc-text-muted" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-semibold text-gwc-text-heading">
              Blank Template
            </span>
            <span className="text-[12px] text-gwc-text-muted text-center max-w-[160px]">
              Start from scratch with the drag-and-drop editor.
            </span>
          </div>
        </button>
      </div>

      {templates.length === 0 && (
        <p className="text-center text-gwc-text-muted py-12">
          No templates found in this category.
        </p>
      )}
    </div>
  );
}
