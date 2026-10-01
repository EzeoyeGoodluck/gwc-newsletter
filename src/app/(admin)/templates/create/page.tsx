"use client";

import { Suspense, useEffect, useState } from "react";
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
import {
  ReviewSendCampaign,
  DeliveryOption,
} from "@/components/templates/review-send-campaign";
import { saveNewsletter, countRecipients } from "@/lib/newsletter-actions";
import { listTemplates } from "../actions";
import { listCategories } from "@/app/(admin)/members/actions";

const BASE_AUDIENCES = ["All Active Members", "All Members"];
const CATEGORIES = ["General", "Events", "Ministry", "Onboarding"];

type WizardStep = 1 | 2 | 3 | 4;

function CreateNewsletterWizardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTemplateId = searchParams.get("templateId");
  const startBlank = searchParams.get("blank") === "true";

  const [step, setStep] = useState<WizardStep>(
    initialTemplateId || startBlank ? 2 : 1
  );
  const [templates, setTemplates] = useState<Template[]>([]);
  const [audiences, setAudiences] = useState<string[]>(BASE_AUDIENCES);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [recipientCount, setRecipientCount] = useState(0);
  const [saving, setSaving] = useState(false);

  const [campaignDetails, setCampaignDetails] = useState<CampaignDetails>({
    campaignName: "",
    subjectLine: "",
    audience: BASE_AUDIENCES[0],
    category: CATEGORIES[0],
    sendOption: "now",
    scheduledDate: "",
  });

  const [content, setContent] = useState<NewsletterContent>({
    subjectLine: "",
    headerImageUrl: "",
    bodyText: "",
  });

  // Load templates + audiences from MySQL
  useEffect(() => {
    listTemplates().then((res) => {
      if (!res.ok) return;
      setTemplates(res.data);
      if (initialTemplateId) {
        const found = res.data.find((t) => t.id === initialTemplateId) ?? null;
        setSelectedTemplate(found);
        if (found) {
          setCampaignDetails((prev) => ({ ...prev, category: found.category }));
        }
      }
    });

    listCategories().then((res) => {
      if (res.ok) {
        setAudiences([...BASE_AUDIENCES, ...res.data.map((c) => c.name)]);
      }
    });
  }, [initialTemplateId]);

  // Real recipient count on the review step
  useEffect(() => {
    if (step !== 4) return;
    countRecipients(campaignDetails.audience).then((res) => {
      if (res.ok) setRecipientCount(res.data);
    });
  }, [step, campaignDetails.audience]);

  const filteredTemplates =
    categoryFilter === "All Categories"
      ? templates
      : templates.filter((t) => t.category === categoryFilter);

  const availableCategories = Array.from(
    new Set(templates.map((t) => t.category))
  );
  const campaignCategories = Array.from(
    new Set([...CATEGORIES, ...availableCategories])
  );

  const handleUseTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setCampaignDetails((prev) => ({ ...prev, category: template.category }));
    setStep(2);
  };

  const handleCreateBlank = () => {
    setSelectedTemplate(null);
    setStep(2);
  };

  const handleStepTwoContinue = (details: CampaignDetails) => {
    setCampaignDetails(details);
    setContent((previous) => ({
      ...previous,
      subjectLine: details.subjectLine,
      headerImageUrl:
        previous.headerImageUrl || selectedTemplate?.imageUrl || "",
    }));
    setStep(3);
  };

  const saveCampaign = async (intent: "draft" | "scheduled" | "send") => {
    if (saving) return;
    setSaving(true);
    const res = await saveNewsletter({
      intent,
      campaignName: campaignDetails.campaignName,
      subjectLine: content.subjectLine || campaignDetails.subjectLine,
      audience: campaignDetails.audience,
      category: campaignDetails.category,
      scheduledDate: campaignDetails.scheduledDate,
      templateId: selectedTemplate?.id ?? null,
      headerImageUrl: content.headerImageUrl,
      bodyText: content.bodyText,
    });
    setSaving(false);

    if (!res.ok) {
      alert(res.message);
      return;
    }
    router.push("/dashboard");
  };

  const handleFinalSend = (option: DeliveryOption) => {
    saveCampaign(option === "schedule" ? "scheduled" : "send");
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
        key={selectedTemplate?.id ?? "blank"}
        templateName={selectedTemplate?.title ?? "Blank Template"}
        initialData={campaignDetails}
        availableAudiences={audiences}
        availableCategories={campaignCategories}
        onBack={() => setStep(1)}
        onContinue={handleStepTwoContinue}
      />
    );
  }

  if (step === 3) {
    return (
      <CreateNewsletterStepThree
        campaignName={campaignDetails.campaignName}
        content={content}
        onContentChange={setContent}
        onBack={() => setStep(2)}
        onSaveDraft={() => saveCampaign("draft")}
        onSend={() => setStep(4)}
      />
    );
  }

  return (
    <ReviewSendCampaign
      campaign={{
        campaignName: campaignDetails.campaignName,
        subjectLine: content.subjectLine || campaignDetails.subjectLine,
        audience: campaignDetails.audience,
        category: campaignDetails.category,
        templateName: selectedTemplate?.title ?? "Blank Template",
        templateImageUrl: content.headerImageUrl || selectedTemplate?.imageUrl,
        recipientCount,
      }}
      onBack={() => setStep(3)}
      onConfirm={handleFinalSend}
    />
  );
}

export default function CreateNewsletterWizard() {
  return (
    <Suspense fallback={null}>
      <CreateNewsletterWizardInner />
    </Suspense>
  );
}
