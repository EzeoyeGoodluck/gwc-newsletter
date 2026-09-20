"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  NewsletterTemplates,
  Template,
} from "@/components/templates/newsletter-templates";
import {
  CreateNewsletterStepTwo,
  CampaignDetails,
} from "@/components/templates/create-newsletter-step-two";
import {
  CreateNewsletterStepThree,
  NewsletterContent,
} from "@/components/templates/create-newsletter-step-three";
import { addCampaign, NewCampaignInput } from "@/lib/campaign-store";

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

const AUDIENCES = [
  "All Members",
  "Youth Ministry",
  "Volunteers",
  "Elders Council",
  "Visitors",
];
const CATEGORIES = ["General", "Events", "Ministry", "Onboarding"];

type WizardStep = 1 | 2 | 3;

export default function CreateNewsletterWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTemplateId = searchParams.get("templateId");
  const startBlank = searchParams.get("blank") === "true";

  const [step, setStep] = useState<WizardStep>(
    initialTemplateId || startBlank ? 2 : 1
  );
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    MOCK_TEMPLATES.find((t) => t.id === initialTemplateId) ?? null
  );
  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  const [campaignDetails, setCampaignDetails] = useState<CampaignDetails>({
    campaignName: "",
    subjectLine: "",
    audience: AUDIENCES[0],
    category: CATEGORIES[0],
    sendOption: "now",
    scheduledDate: "",
  });

  const [content, setContent] = useState<NewsletterContent>({
    subjectLine: "",
    headerImageUrl: "",
    bodyText: "",
  });

  const filteredTemplates =
    categoryFilter === "All Categories"
      ? MOCK_TEMPLATES
      : MOCK_TEMPLATES.filter((t) => t.category === categoryFilter);

  const availableCategories = Array.from(
    new Set(MOCK_TEMPLATES.map((t) => t.category))
  );

  const handleUseTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setStep(2);
  };

  const handleCreateBlank = () => {
    setSelectedTemplate(null);
    setStep(2);
  };

  const handleStepTwoContinue = (details: CampaignDetails) => {
    setCampaignDetails(details);
    setContent((prev) => ({ ...prev, subjectLine: details.subjectLine }));
    setStep(3);
  };

  const finalizeCampaign = (status: "draft" | "scheduled" | "sent") => {
    const newCampaign: NewCampaignInput = {
      title: campaignDetails.campaignName || "Untitled Campaign",
      category: campaignDetails.category,
      status,
      audience: campaignDetails.audience,
    };
    addCampaign(newCampaign);
    router.push("/dashboard");
  };

  const handleSaveDraft = () => finalizeCampaign("draft");

  const handleSend = () => {
    const status =
      campaignDetails.sendOption === "schedule" ? "scheduled" : "sent";
    finalizeCampaign(status);
  };

  if (step === 1) {
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

  if (step === 2) {
    return (
      <CreateNewsletterStepTwo
        templateName={selectedTemplate?.title ?? "Blank Template"}
        initialData={campaignDetails}
        availableAudiences={AUDIENCES}
        availableCategories={CATEGORIES}
        onBack={() => setStep(1)}
        onContinue={handleStepTwoContinue}
      />
    );
  }

  return (
    <CreateNewsletterStepThree
      campaignName={campaignDetails.campaignName}
      content={content}
      onContentChange={setContent}
      onBack={() => setStep(2)}
      onSaveDraft={handleSaveDraft}
      onSend={handleSend}
    />
  );
}
