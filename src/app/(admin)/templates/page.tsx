"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  NewsletterTemplates,
  type Template,
} from "@/components/templates/newsletter-templates";

import { listTemplates } from "./actions";

function TemplatesPageSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-8">
      <span className="sr-only">Loading newsletter templates…</span>

      <div
        aria-hidden="true"
        className="animate-pulse space-y-8 motion-reduce:animate-none"
      >
        {/* Heading and category filter */}
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 space-y-3">
            <div className="h-8 w-52 max-w-full rounded bg-slate-200" />
            <div className="h-3 w-80 max-w-full rounded bg-slate-200" />
          </div>

          <div className="h-10 w-40 rounded-lg bg-slate-200" />
        </div>

        {/* Template cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="flex min-w-0 flex-col overflow-hidden rounded-xl border border-gwc-border/20 bg-white shadow-sm"
            >
              <div className="h-[220px] w-full bg-slate-200" />

              <div className="flex flex-1 flex-col p-5">
                <div className="h-5 w-20 rounded-full bg-slate-100" />

                <div className="mt-3 h-5 w-3/4 rounded bg-slate-200" />

                <div className="mt-4 space-y-2">
                  <div className="h-3 w-full rounded bg-slate-100" />
                  <div className="h-3 w-11/12 rounded bg-slate-100" />
                  <div className="h-3 w-2/3 rounded bg-slate-100" />
                </div>

                <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                  <div className="h-3 w-24 rounded bg-slate-100" />
                  <div className="h-10 w-28 rounded-lg bg-slate-200" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Blank-template card */}
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-gwc-border/50 bg-white px-6 py-8 sm:flex-row">
          <div className="h-12 w-12 shrink-0 rounded-full bg-slate-100" />

          <div className="w-full max-w-sm space-y-3">
            <div className="mx-auto h-4 w-48 max-w-full rounded bg-slate-200 sm:mx-0" />
            <div className="h-3 w-full rounded bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const router = useRouter();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setMessage(null);

    async function loadTemplates() {
      try {
        const result = await listTemplates();

        if (cancelled) return;

        if (result.ok) {
          setTemplates(result.data);
        } else {
          setMessage(result.message);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load newsletter templates:", error);

          setMessage(
            "Unable to load the newsletter templates. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTemplates();

    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  const filteredTemplates = useMemo(() => {
    if (categoryFilter === "All Categories") return templates;

    return templates.filter((template) => template.category === categoryFilter);
  }, [templates, categoryFilter]);

  const availableCategories = useMemo(
    () => Array.from(new Set(templates.map((template) => template.category))),
    [templates]
  );

  const handleUseTemplate = (template: Template) => {
    router.push(
      `/templates/create?templateId=${encodeURIComponent(template.id)}`
    );
  };

  const handleCreateBlank = () => {
    router.push("/templates/create?blank=true");
  };

  if (loading) {
    return <TemplatesPageSkeleton />;
  }

  if (message && templates.length === 0) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold text-gwc-navy">
          Unable to load templates
        </h1>

        <p role="alert" className="mt-2 text-sm leading-6 text-red-600">
          {message}
        </p>

        <button
          type="button"
          onClick={() => setRetryCount((previous) => previous + 1)}
          className="mt-4 cursor-pointer rounded-lg bg-gwc-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gwc-navy focus-visible:ring-offset-2"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      {message && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p role="alert" className="text-sm text-red-700">
            {message}
          </p>

          <button
            type="button"
            onClick={() => setRetryCount((previous) => previous + 1)}
            className="cursor-pointer text-sm font-semibold text-gwc-navy underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gwc-navy"
          >
            Retry
          </button>
        </div>
      )}

      <NewsletterTemplates
        templates={filteredTemplates}
        categoryFilter={categoryFilter}
        availableCategories={availableCategories}
        onCategoryFilterChange={setCategoryFilter}
        onUseTemplate={handleUseTemplate}
        onCreateBlank={handleCreateBlank}
      />
    </>
  );
}
