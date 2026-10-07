"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  NewsletterTemplates,
  type Template,
} from "@/components/templates/newsletter-templates";

import {
  CreateNewsletterStepTwo,
  type CampaignDetails,
} from "@/components/templates/create-newsletter-step-two";

import {
  CreateNewsletterStepThree,
  type NewsletterContent,
} from "@/components/templates/create-newsletter-step-three";

import {
  ReviewSendCampaign,
  type DeliveryOption,
  type CampaignSendResult,
} from "@/components/templates/review-send-campaign";

import { saveNewsletter, countRecipients } from "@/lib/newsletter-actions";

import { listTemplates } from "../actions";
import { listCategories } from "@/app/(admin)/members/actions";

const BASE_AUDIENCES = ["All Active Members", "All Members"];
const CATEGORIES = ["General", "Events", "Ministry", "Onboarding"];

type WizardStep = 1 | 2 | 3 | 4;
type SaveIntent = "draft" | "send";

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
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [recipientError, setRecipientError] = useState("");

  const [saving, setSaving] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [submissionLocked, setSubmissionLocked] = useState(false);

  const [savedCampaignId, setSavedCampaignId] = useState<string | null>(null);

  const [sendResult, setSendResult] = useState<CampaignSendResult | null>(null);

  const savingRef = useRef(false);
  const submissionLockedRef = useRef(false);
  const savedCampaignIdRef = useRef<string | null>(null);

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
    previewText: "",
    blocks: [],
  });

  function setSubmissionLock(locked: boolean) {
    submissionLockedRef.current = locked;
    setSubmissionLocked(locked);
  }

  function canEditCampaign() {
    return (
      !savingRef.current &&
      !submissionLockedRef.current &&
      !savedCampaignIdRef.current
    );
  }

  // Load template metadata and available audiences.
  useEffect(() => {
    let cancelled = false;

    async function loadTemplates() {
      try {
        const result = await listTemplates();

        if (cancelled) return;

        if (!result.ok) {
          console.error(result.message);
          return;
        }

        setTemplates(result.data);

        if (initialTemplateId) {
          const found =
            result.data.find((template) => template.id === initialTemplateId) ??
            null;

          setSelectedTemplate(found);

          if (found) {
            setCampaignDetails((previous) => ({
              ...previous,
              category: found.category,
            }));

            setContent((previous) => ({
              ...previous,
              headerImageUrl: previous.headerImageUrl || found.imageUrl || "",
            }));
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load templates:", error);
        }
      }
    }

    async function loadAudiences() {
      try {
        const result = await listCategories();

        if (cancelled) return;

        if (!result.ok) {
          console.error(result.message);
          return;
        }

        setAudiences(
          Array.from(
            new Set([
              ...BASE_AUDIENCES,
              ...result.data.map((category) => category.name),
            ])
          )
        );
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load audiences:", error);
        }
      }
    }

    void loadTemplates();
    void loadAudiences();

    return () => {
      cancelled = true;
    };
  }, [initialTemplateId]);

  // Verify the audience count before allowing final confirmation.
  useEffect(() => {
    if (step !== 4) return;

    let cancelled = false;

    setRecipientsLoading(true);
    setRecipientError("");
    setRecipientCount(0);

    async function loadRecipientCount() {
      try {
        const result = await countRecipients(campaignDetails.audience);

        if (cancelled) return;

        if (!result.ok) {
          setRecipientError(result.message);
          return;
        }

        setRecipientCount(result.data);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to count recipients:", error);

          setRecipientError(
            "Unable to verify the recipient count. Return to the editor and try again."
          );
        }
      } finally {
        if (!cancelled) {
          setRecipientsLoading(false);
        }
      }
    }

    void loadRecipientCount();

    return () => {
      cancelled = true;
    };
  }, [step, campaignDetails.audience]);

  const filteredTemplates =
    categoryFilter === "All Categories"
      ? templates
      : templates.filter((template) => template.category === categoryFilter);

  const availableCategories = Array.from(
    new Set(templates.map((template) => template.category))
  );

  const campaignCategories = Array.from(
    new Set([...CATEGORIES, ...availableCategories])
  );

  const handleUseTemplate = (template: Template) => {
    if (!canEditCampaign()) return;

    setSelectedTemplate(template);

    setCampaignDetails((previous) => ({
      ...previous,
      category: template.category,
    }));

    // Saved template-design loading is not connected yet.
    setContent({
      subjectLine: campaignDetails.subjectLine,
      headerImageUrl: template.imageUrl || "",
      bodyText: "",
      previewText: "",
      blocks: [],
    });

    setSubmissionError("");
    setStep(2);
  };

  const handleCreateBlank = () => {
    if (!canEditCampaign()) return;

    setSelectedTemplate(null);

    setContent({
      subjectLine: campaignDetails.subjectLine,
      headerImageUrl: "",
      bodyText: "",
      previewText: "",
      blocks: [],
    });

    setSubmissionError("");
    setStep(2);
  };

  const handleStepTwoContinue = (details: CampaignDetails) => {
    if (!canEditCampaign()) return;

    setCampaignDetails(details);

    setContent((previous) => ({
      ...previous,
      subjectLine: details.subjectLine,
    }));

    setSubmissionError("");
    setStep(3);
  };

  const handleBackToDetails = () => {
    if (!canEditCampaign()) return;

    setCampaignDetails((previous) => ({
      ...previous,
      subjectLine: content.subjectLine,
    }));

    setStep(2);
  };

  const handleReview = () => {
    if (!canEditCampaign()) return;

    if (!content.subjectLine.trim()) {
      window.alert("Please enter a subject line before reviewing.");
      return;
    }

    // Set immediately so stale recipient counts cannot enable sending.
    setRecipientCount(0);
    setRecipientsLoading(true);
    setRecipientError("");
    setSubmissionError("");
    setStep(4);
  };

  const saveCampaign = async (intent: SaveIntent) => {
    if (
      savingRef.current ||
      submissionLockedRef.current ||
      savedCampaignIdRef.current
    ) {
      return;
    }

    if (intent === "send") {
      if (!content.subjectLine.trim()) {
        setSubmissionError("A subject line is required before sending.");
        return;
      }

      if (recipientsLoading || recipientError || recipientCount <= 0) {
        setSubmissionError(
          "Verify that the selected audience has eligible recipients before sending."
        );
        return;
      }
    }

    savingRef.current = true;
    setSaving(true);
    setSubmissionError("");

    // Lock all submissions until a definite outcome is known.
    setSubmissionLock(true);

    try {
      const result = await saveNewsletter({
        intent,
        campaignName: campaignDetails.campaignName,
        subjectLine: content.subjectLine,
        audience: campaignDetails.audience,
        category: campaignDetails.category,
        templateId: selectedTemplate?.id ?? null,
        headerImageUrl: content.headerImageUrl,
        bodyText: content.bodyText,
        previewText: content.previewText ?? "",
        blocks: content.blocks,
      });

      if (!result.ok) {
        // The server returned a known rejection.
        setSubmissionLock(false);

        if (intent === "send") {
          setSubmissionError(result.message);
        } else {
          window.alert(result.message);
        }

        return;
      }

      savedCampaignIdRef.current = result.data.id;
      setSavedCampaignId(result.data.id);

      if (intent === "draft") {
        router.push("/dashboard");
        return;
      }

      // Process this saved campaign, not a new copy.
      const response = await fetch("/api/campaigns/process", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId: result.data.id,
          confirmed: true,
        }),
      });

      const processingResult = await response.json();

      if (!response.ok) {
        setSubmissionError(
          `The campaign was saved, but its processing request did not complete successfully: ${
            processingResult.error ?? "Unknown processing error."
          } Do not create another copy to retry. Inspect this campaign's queue first.`
        );
        return;
      }

      setSendResult(processingResult as CampaignSendResult);
    } catch (error) {
      console.error("Newsletter submission failed:", error);

      const message = savedCampaignIdRef.current
        ? "The campaign was saved, but a processing result could not be confirmed. Inspect its queue before retrying."
        : "The save result could not be confirmed. Check the campaign list before creating another copy.";

      setSubmissionError(message);

      // Keep locked after an uncertain result to prevent resaving.
      setSubmissionLock(true);

      if (intent === "draft") {
        window.alert(message);
        router.push("/dashboard");
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleFinalSend = (option: DeliveryOption) => {
    if (
      savingRef.current ||
      submissionLockedRef.current ||
      savedCampaignIdRef.current
    ) {
      return;
    }

    if (option !== "now") {
      setSubmissionError(
        "Only Send Now is connected in this version. Scheduling and automatic batch continuation are not enabled yet."
      );
      return;
    }

    void saveCampaign("send");
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
        onBack={() => {
          if (canEditCampaign()) setStep(1);
        }}
        onContinue={handleStepTwoContinue}
      />
    );
  }

  if (step === 3) {
    return (
      <CreateNewsletterStepThree
        campaignName={campaignDetails.campaignName}
        content={content}
        onContentChange={(nextContent) => {
          if (canEditCampaign()) setContent(nextContent);
        }}
        onBack={handleBackToDetails}
        onSaveDraft={() => {
          void saveCampaign("draft");
        }}
        onSend={handleReview}
        saving={saving || submissionLocked}
      />
    );
  }

  return (
    <ReviewSendCampaign
      campaign={{
        campaignName: campaignDetails.campaignName,
        subjectLine: content.subjectLine,
        audience: campaignDetails.audience,
        category: campaignDetails.category,
        templateName: selectedTemplate?.title ?? "Blank Template",
        templateImageUrl: content.headerImageUrl || selectedTemplate?.imageUrl,
        recipientCount,
      }}
      saving={saving}
      recipientsLoading={recipientsLoading}
      recipientError={recipientError}
      submissionError={submissionError}
      submissionLocked={submissionLocked}
      savedCampaignId={savedCampaignId}
      sendResult={sendResult}
      onBack={() => {
        if (canEditCampaign()) setStep(3);
      }}
      onConfirm={handleFinalSend}
      onFinish={() => router.push("/dashboard")}
    />
  );
}

export default function CreateNewsletterWizard() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-sm text-gwc-text-muted">
          Loading newsletter wizard…
        </div>
      }
    >
      <CreateNewsletterWizardInner />
    </Suspense>
  );
}
