"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import {
  NewsletterTemplates,
  Template,
} from "@/components/templates/newsletter-templates";

const MOCK_TEMPLATES: Template[] = [
  {
    id: "1",
    title: "Annual Worship & Revival",
    description:
      "Immersive worship gathering layout with event schedule, speaker details, and RSVP call-to-action.",
    imageUrl:
      "https://images.unsplash.com/photo-1519070994522-88c6b756f9dc?w=600",
    category: "Events",
    updatedLabel: "Updated 3 days ago",
  },
  {
    id: "2",
    title: "Weekly Bulletin",
    description:
      "Standard layout for Sunday service order, announcements, and key contacts.",
    imageUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600",
    category: "General",
    updatedLabel: "Updated 2 days ago",
    popular: true,
  },
  {
    id: "3",
    title: "Youth Ministry Update",
    description:
      "Vibrant design tailored for teen events, volunteer sign-ups, and parent info.",
    imageUrl:
      "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=600",
    category: "Ministry",
    updatedLabel: "Updated 1 week ago",
  },
  {
    id: "4",
    title: "Special Event Announcement",
    description:
      "High-impact layout for conferences, holiday services, and community outreach.",
    imageUrl: "https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=600",
    category: "Events",
    updatedLabel: "Updated 2 weeks ago",
  },
  {
    id: "5",
    title: "New Member Welcome",
    description:
      "Warm, invitational sequence introducing church vision, staff, and next steps.",
    imageUrl:
      "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600",
    category: "Onboarding",
    updatedLabel: "Updated 1 month ago",
  },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [templates] = useState<Template[]>(MOCK_TEMPLATES);
  const [categoryFilter, setCategoryFilter] = useState("All Categories");

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
    <NewsletterTemplates
      templates={filteredTemplates}
      categoryFilter={categoryFilter}
      availableCategories={availableCategories}
      onCategoryFilterChange={setCategoryFilter}
      onUseTemplate={handleUseTemplate}
      onCreateBlank={handleCreateBlank}
    />
  );
}
