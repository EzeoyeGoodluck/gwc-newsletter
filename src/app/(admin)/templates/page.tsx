"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  NewsletterTemplates,
  Template,
} from "@/components/templates/newsletter-templates";
import { listTemplates } from "./actions";

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    listTemplates().then((res) => {
      if (res.ok) setTemplates(res.data);
      else setMessage(res.message);
    });
  }, []);

  const filteredTemplates = useMemo(() => {
    if (categoryFilter === "All Categories") return templates;
    return templates.filter((t) => t.category === categoryFilter);
  }, [templates, categoryFilter]);

  const availableCategories = useMemo(
    () => Array.from(new Set(templates.map((t) => t.category))),
    [templates]
  );

  const handleUseTemplate = (template: Template) => {
    router.push(`/templates/create?templateId=${template.id}`);
  };

  const handleCreateBlank = () => {
    router.push("/templates/create?blank=true");
  };

  return (
    <>
      {message && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {message}
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
