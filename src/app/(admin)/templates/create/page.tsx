"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import {
  NewsletterTemplates,
  type Template,
} from "@/components/templates/newsletter-templates";

import type { CampaignDetails } from "@/components/templates/create-newsletter-step-two";

import {
  CreateNewsletterStepThree,
  type NewsletterContent,
} from "@/components/templates/create-newsletter-step-three";

import {
  ReviewSendCampaign,
  type DeliveryOption,
  type CampaignSendResult,
} from "@/components/templates/review-send-campaign";

import {
  saveNewsletter,
  countRecipients,
  getNewsletterForEditing,
} from "@/lib/newsletter-actions";

import { parseTemplateDesign } from "@/lib/newsletter-template-presets";

import { getTemplate, listTemplates } from "../actions";
import { listCategories } from "@/app/(admin)/members/actions";

const BASE_AUDIENCES = ["All Active Members", "All Members"];

const CATEGORIES = ["General", "Events", "Ministry", "Onboarding"];

const settingsInputClass =
  "w-full rounded-lg border border-gwc-border/40 bg-gwc-muted-bg px-3 py-2.5 text-sm text-gwc-navy outline-none focus:border-gwc-navy focus:ring-2 focus:ring-gwc-navy/10 disabled:cursor-not-allowed disabled:opacity-60";

type WizardStep = 1 | 3 | 4;
type SaveIntent = "draft" | "send";

interface WizardInnerProps {
  initialTemplateId: string | null;
  startBlank: boolean;
  campaignId: string | null;
  reviewRequested: boolean;
}

function CreateNewsletterWizardInner({
  initialTemplateId,
  startBlank,
  campaignId,
  reviewRequested,
}: WizardInnerProps) {
  const router = useRouter();

  const shouldLoadInitialTemplate =
    !campaignId && Boolean(initialTemplateId) && !startBlank;

  const requiresInitialContent =
    Boolean(campaignId) || shouldLoadInitialTemplate;

  const [step, setStep] = useState<WizardStep>(
    campaignId || initialTemplateId || startBlank ? 3 : 1
  );

  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState("");
  const [templateRetry, setTemplateRetry] = useState(0);

  const [audiences, setAudiences] = useState<string[]>(BASE_AUDIENCES);

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );

  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  const [contentLoading, setContentLoading] = useState(requiresInitialContent);

  const [contentLoadError, setContentLoadError] = useState("");

  const [existingCampaignId, setExistingCampaignId] = useState<string | null>(
    null
  );

  const [existingTemplateId, setExistingTemplateId] = useState<string | null>(
    null
  );

  const [recipientCount, setRecipientCount] = useState(0);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [recipientError, setRecipientError] = useState("");

  const [saving, setSaving] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [submissionLocked, setSubmissionLocked] = useState(false);

  const [savedCampaignId, setSavedCampaignId] = useState<string | null>(null);

  const [sendResult, setSendResult] = useState<CampaignSendResult | null>(null);

  const contentLoadingRef = useRef(requiresInitialContent);
  const contentLoadFailedRef = useRef(false);
  const initialTemplateAppliedRef = useRef(false);

  const savingRef = useRef(false);
  const submissionLockedRef = useRef(false);
  const savedCampaignIdRef = useRef<string | null>(null);

  const recipientRequestRef = useRef(0);
  const verifiedAudienceRef = useRef<string | null>(null);

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
      !contentLoadingRef.current &&
      !contentLoadFailedRef.current &&
      !savingRef.current &&
      !submissionLockedRef.current &&
      !savedCampaignIdRef.current &&
      (!campaignId || existingCampaignId === campaignId)
    );
  }

  function invalidateRecipientCount() {
    recipientRequestRef.current += 1;
    verifiedAudienceRef.current = null;

    setRecipientCount(0);
    setRecipientsLoading(true);
    setRecipientError("");
  }

  // Both template-selection paths use this same loader.
  const applyTemplateDesign = useCallback((template: Template): boolean => {
    const design = parseTemplateDesign(template.design);

    if (!design || design.blocks.length === 0) {
      return false;
    }

    const nextBlocks = design.blocks.map((block) => ({
      id: block.id,
      type: block.type,
      fields: {
        ...block.fields,
      },
    }));

    setSelectedTemplate(template);
    setExistingTemplateId(null);

    setCampaignDetails((previous) => ({
      ...previous,
      campaignName: previous.campaignName.trim() || template.title,
      subjectLine: design.subjectLine,
      category: template.category,
    }));

    setContent({
      subjectLine: design.subjectLine,

      // Only use the image saved in the newsletter design.
      // Do not substitute the library thumbnail.
      headerImageUrl: design.headerImageUrl,

      bodyText: design.bodyText,
      previewText: design.previewText,
      blocks: nextBlocks,
    });

    verifiedAudienceRef.current = null;
    recipientRequestRef.current += 1;

    setRecipientCount(0);
    setRecipientError("");
    setSubmissionError("");
    setStep(3);

    return true;
  }, []);

  // Existing campaigns load their own saved content.
  // Template defaults must never overwrite them.
  useEffect(() => {
    if (!campaignId) return;

    let cancelled = false;

    contentLoadingRef.current = true;
    contentLoadFailedRef.current = false;

    setContentLoading(true);
    setContentLoadError("");

    async function loadCampaign(id: string) {
      try {
        const result = await getNewsletterForEditing(id);

        if (cancelled) return;

        if (!result.ok) {
          contentLoadFailedRef.current = true;
          setContentLoadError(result.message);
          return;
        }

        const campaign = result.data;

        setExistingCampaignId(campaign.id);
        setExistingTemplateId(campaign.templateId);

        setCampaignDetails({
          campaignName: campaign.campaignName,
          subjectLine: campaign.subjectLine,
          audience: campaign.audience,
          category: campaign.category,
          sendOption: "now",
          scheduledDate: "",
        });

        setContent({
          subjectLine: campaign.subjectLine,
          headerImageUrl: campaign.headerImageUrl,
          bodyText: campaign.bodyText,
          previewText: campaign.previewText,

          // Preserve the legacy text path if no blocks were saved.
          ...(campaign.blocks !== undefined
            ? {
                blocks: campaign.blocks.map((block) => ({
                  ...block,
                  fields: { ...block.fields },
                })),
              }
            : {}),
        });

        setStep(reviewRequested ? 4 : 3);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load campaign:", error);

          contentLoadFailedRef.current = true;

          setContentLoadError(
            "Unable to load this campaign. Return to the dashboard and try again."
          );
        }
      } finally {
        if (!cancelled) {
          contentLoadingRef.current = false;
          setContentLoading(false);
        }
      }
    }

    void loadCampaign(campaignId);

    return () => {
      cancelled = true;
    };
  }, [campaignId, reviewRequested]);

  // Load the library and, when supplied, the initial template.
  useEffect(() => {
    let cancelled = false;

    const needsInitialTemplate =
      shouldLoadInitialTemplate && !initialTemplateAppliedRef.current;

    setTemplatesLoading(true);
    setTemplatesError("");

    if (needsInitialTemplate) {
      contentLoadingRef.current = true;
      contentLoadFailedRef.current = false;

      setContentLoading(true);
      setContentLoadError("");
    }

    async function loadTemplates() {
      try {
        const result = await listTemplates();

        if (cancelled) return;

        if (!result.ok) {
          setTemplatesError(result.message);

          if (needsInitialTemplate) {
            contentLoadFailedRef.current = true;
            setContentLoadError(result.message);
          }

          return;
        }

        setTemplates(result.data);

        if (!needsInitialTemplate || !initialTemplateId) {
          return;
        }

        let found =
          result.data.find((template) => template.id === initialTemplateId) ??
          null;

        // Older templates may not be listed in the new library,
        // but can still be retrieved by their saved ID.
        if (!found) {
          const templateResult = await getTemplate(initialTemplateId);

          if (cancelled) return;

          if (!templateResult.ok) {
            contentLoadFailedRef.current = true;
            setContentLoadError(templateResult.message);
            return;
          }

          found = templateResult.data;
        }

        if (!found) {
          contentLoadFailedRef.current = true;

          setContentLoadError(
            "This template could not be found. Return to the library and choose another template."
          );

          return;
        }

        const loaded = applyTemplateDesign(found);

        if (!loaded) {
          contentLoadFailedRef.current = true;

          setContentLoadError(
            "This template has no saved newsletter design. Return to the library and choose one of the three new templates."
          );

          return;
        }

        initialTemplateAppliedRef.current = true;
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load templates:", error);

          const message =
            "Unable to load the newsletter templates. Please try again.";

          setTemplatesError(message);

          if (needsInitialTemplate) {
            contentLoadFailedRef.current = true;
            setContentLoadError(message);
          }
        }
      } finally {
        if (!cancelled) {
          setTemplatesLoading(false);

          if (needsInitialTemplate) {
            contentLoadingRef.current = false;
            setContentLoading(false);
          }
        }
      }
    }

    void loadTemplates();

    return () => {
      cancelled = true;
    };
  }, [
    initialTemplateId,
    shouldLoadInitialTemplate,
    templateRetry,
    applyTemplateDesign,
  ]);

  useEffect(() => {
    let cancelled = false;

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

    void loadAudiences();

    return () => {
      cancelled = true;
    };
  }, []);

  // Verify the current audience before allowing a send.
  useEffect(() => {
    if (step !== 4 || contentLoading || contentLoadError || submissionLocked) {
      return;
    }

    let cancelled = false;

    const audience = campaignDetails.audience;
    const requestId = ++recipientRequestRef.current;

    verifiedAudienceRef.current = null;

    setRecipientsLoading(true);
    setRecipientError("");
    setRecipientCount(0);

    function isCurrentRequest() {
      return !cancelled && recipientRequestRef.current === requestId;
    }

    async function loadRecipientCount() {
      try {
        const result = await countRecipients(audience);

        if (!isCurrentRequest()) return;

        if (!result.ok) {
          setRecipientError(result.message);
          return;
        }

        verifiedAudienceRef.current = audience;
        setRecipientCount(result.data);
      } catch (error) {
        if (isCurrentRequest()) {
          console.error("Failed to count recipients:", error);

          setRecipientError(
            "Unable to verify the recipient count. Return to the editor and try again."
          );
        }
      } finally {
        if (isCurrentRequest()) {
          setRecipientsLoading(false);
        }
      }
    }

    void loadRecipientCount();

    return () => {
      cancelled = true;
    };
  }, [
    step,
    campaignDetails.audience,
    contentLoading,
    contentLoadError,
    submissionLocked,
  ]);

  const filteredTemplates =
    categoryFilter === "All Categories"
      ? templates
      : templates.filter((template) => template.category === categoryFilter);

  const availableCategories = Array.from(
    new Set(templates.map((template) => template.category))
  );

  const campaignCategories = Array.from(
    new Set([...CATEGORIES, ...availableCategories, campaignDetails.category])
  );

  const availableAudiences = Array.from(
    new Set([...audiences, campaignDetails.audience])
  );

  const displayTemplate =
    selectedTemplate ??
    templates.find((template) => template.id === existingTemplateId) ??
    null;

  const handleUseTemplate = (template: Template) => {
    if (!canEditCampaign()) return;

    const loaded = applyTemplateDesign(template);

    if (!loaded) {
      const message =
        "This template has no saved newsletter design. Choose one of the three new templates.";

      setSubmissionError(message);
      window.alert(message);
    }
  };

  const handleCreateBlank = () => {
    if (!canEditCampaign()) return;

    setSelectedTemplate(null);
    setExistingTemplateId(null);

    setCampaignDetails((previous) => ({
      ...previous,
      subjectLine: content.subjectLine,
      category: CATEGORIES[0],
    }));

    setContent({
      subjectLine: content.subjectLine,
      headerImageUrl: "",
      bodyText: "",
      previewText: "",
      blocks: [],
    });

    verifiedAudienceRef.current = null;
    recipientRequestRef.current += 1;

    setRecipientCount(0);
    setRecipientError("");
    setSubmissionError("");
    setStep(3);
  };

  const handleBackToTemplates = () => {
    if (!canEditCampaign()) return;

    setCampaignDetails((previous) => ({
      ...previous,
      subjectLine: content.subjectLine,
    }));

    setSubmissionError("");
    setStep(1);
  };

  const handleReview = () => {
    if (!canEditCampaign()) return;

    if (!content.subjectLine.trim()) {
      window.alert("Please enter a subject line before reviewing.");
      return;
    }

    setCampaignDetails((previous) => ({
      ...previous,
      subjectLine: content.subjectLine,
      campaignName: previous.campaignName.trim() || content.subjectLine.trim(),
    }));

    invalidateRecipientCount();
    setSubmissionError("");
    setStep(4);
  };

  const handleAudienceChange = (audience: string) => {
    if (!canEditCampaign()) return;
    if (audience === campaignDetails.audience) return;

    invalidateRecipientCount();
    setSubmissionError("");

    setCampaignDetails((previous) => ({
      ...previous,
      audience,
    }));
  };

  const saveCampaign = async (intent: SaveIntent) => {
    if (!canEditCampaign()) return;

    if (intent === "send") {
      if (!campaignDetails.campaignName.trim()) {
        setSubmissionError("Enter a campaign name before sending.");
        return;
      }

      if (!content.subjectLine.trim()) {
        setSubmissionError("A subject line is required before sending.");
        return;
      }

      if (
        recipientsLoading ||
        recipientError ||
        recipientCount <= 0 ||
        verifiedAudienceRef.current !== campaignDetails.audience
      ) {
        setSubmissionError(
          "Verify that the selected audience has eligible recipients before sending."
        );
        return;
      }
    }

    savingRef.current = true;
    setSaving(true);
    setSubmissionError("");
    setSubmissionLock(true);

    try {
      const result = await saveNewsletter({
        id: existingCampaignId ?? undefined,
        intent,
        campaignName:
          campaignDetails.campaignName.trim() ||
          content.subjectLine.trim() ||
          "Untitled Campaign",
        subjectLine: content.subjectLine,
        audience: campaignDetails.audience,
        category: campaignDetails.category,
        templateId: selectedTemplate?.id ?? existingTemplateId,
        headerImageUrl: content.headerImageUrl,
        bodyText: content.bodyText,
        previewText: content.previewText ?? "",
        blocks: content.blocks,
      });

      if (!result.ok) {
        setSubmissionLock(false);
        setSubmissionError(result.message);

        if (intent === "draft") {
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

      // Process the campaign that was just saved.
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
        const processingError =
          typeof processingResult?.error === "string"
            ? processingResult.error
            : "Unknown processing error.";

        setSubmissionError(
          `The campaign was saved, but its processing request did not complete successfully: ${processingError} Do not create another copy to retry. Inspect this campaign's queue first.`
        );

        return;
      }

      setSendResult(processingResult as CampaignSendResult);
    } catch (error) {
      console.error("Newsletter submission failed:", error);

      const message = savedCampaignIdRef.current
        ? "The campaign was saved, but a processing result could not be confirmed. Inspect its queue before retrying."
        : "The save result could not be confirmed. Check the campaign list before retrying.";

      setSubmissionError(message);

      // Do not repeat a submission whose result is uncertain.
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
    if (!canEditCampaign()) return;

    if (option !== "now") {
      setSubmissionError(
        "Only Send Now is connected in this version. Scheduling and automatic batch continuation are not enabled yet."
      );

      return;
    }

    void saveCampaign("send");
  };

  if (contentLoading) {
    return (
      <div role="status" className="p-6 text-sm text-gwc-text-muted">
        {campaignId ? "Loading campaign…" : "Loading newsletter design…"}
      </div>
    );
  }

  if (contentLoadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gwc-navy">
          {campaignId ? "Unable to open campaign" : "Unable to open template"}
        </h2>

        <p role="alert" className="mt-2 text-sm text-red-600">
          {contentLoadError}
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          {!campaignId && (
            <button
              type="button"
              onClick={() => {
                setTemplateRetry((previous) => previous + 1);
              }}
              className="cursor-pointer rounded-lg border border-gwc-border px-4 py-2 text-sm font-semibold text-gwc-navy"
            >
              Try again
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              router.push(campaignId ? "/dashboard" : "/templates")
            }
            className="cursor-pointer rounded-lg bg-gwc-navy px-4 py-2 text-sm font-semibold text-white"
          >
            {campaignId ? "Back to dashboard" : "Back to template library"}
          </button>
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="space-y-4">
        {templatesLoading && (
          <p role="status" className="text-sm text-gwc-text-muted">
            Loading templates…
          </p>
        )}

        {templatesError && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p role="alert" className="text-sm text-red-600">
              {templatesError}
            </p>

            <button
              type="button"
              onClick={() => setTemplateRetry((previous) => previous + 1)}
              disabled={templatesLoading}
              className="cursor-pointer text-sm font-semibold text-gwc-navy underline disabled:opacity-50"
            >
              Retry
            </button>
          </div>
        )}

        {submissionError && (
          <p role="alert" className="text-sm text-red-600">
            {submissionError}
          </p>
        )}

        <NewsletterTemplates
          templates={filteredTemplates}
          categoryFilter={categoryFilter}
          availableCategories={availableCategories}
          onCategoryFilterChange={setCategoryFilter}
          onUseTemplate={handleUseTemplate}
          onCreateBlank={handleCreateBlank}
        />
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="space-y-4">
        {submissionError && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {submissionError}
          </p>
        )}

        <CreateNewsletterStepThree
          campaignName={campaignDetails.campaignName}
          onCampaignNameChange={(campaignName) => {
            if (!canEditCampaign()) return;

            setCampaignDetails((previous) => ({
              ...previous,
              campaignName,
            }));

            setSubmissionError("");
          }}
          content={content}
          onContentChange={(nextContent) => {
            if (!canEditCampaign()) return;

            setContent(nextContent);
            setSubmissionError("");
          }}
          onBack={handleBackToTemplates}
          onSaveDraft={() => {
            void saveCampaign("draft");
          }}
          onSend={handleReview}
          saving={saving || submissionLocked}
        />
      </div>
    );
  }

  const settingsDisabled =
    saving || submissionLocked || savedCampaignId !== null;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-gwc-border/20 bg-white p-5">
        <h2 className="text-lg font-semibold text-gwc-navy">
          Campaign settings
        </h2>

        <p className="mt-1 text-sm text-gwc-text-muted">
          Name your campaign and confirm its audience before sending.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-xs font-semibold text-gwc-navy">
            Campaign name
            <input
              type="text"
              value={campaignDetails.campaignName}
              disabled={settingsDisabled}
              placeholder="Enter a campaign name"
              className={settingsInputClass}
              onChange={(event) => {
                if (!canEditCampaign()) return;

                const campaignName = event.target.value;

                setCampaignDetails((previous) => ({
                  ...previous,
                  campaignName,
                }));

                setSubmissionError("");
              }}
            />
          </label>

          <label className="flex flex-col gap-2 text-xs font-semibold text-gwc-navy">
            Audience
            <select
              value={campaignDetails.audience}
              disabled={settingsDisabled}
              className={settingsInputClass}
              onChange={(event) => handleAudienceChange(event.target.value)}
            >
              {availableAudiences.map((audience) => (
                <option key={audience} value={audience}>
                  {audience}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-xs font-semibold text-gwc-navy">
            Category
            <select
              value={campaignDetails.category}
              disabled={settingsDisabled}
              className={settingsInputClass}
              onChange={(event) => {
                if (!canEditCampaign()) return;

                const category = event.target.value;

                setCampaignDetails((previous) => ({
                  ...previous,
                  category,
                }));

                setSubmissionError("");
              }}
            >
              {campaignCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="mt-3 text-xs text-gwc-text-muted">
          Changing the audience triggers a new recipient-count check.
        </p>
      </section>

      <ReviewSendCampaign
        campaign={{
          campaignName: campaignDetails.campaignName,
          subjectLine: content.subjectLine,
          audience: campaignDetails.audience,
          category: campaignDetails.category,
          templateName:
            displayTemplate?.title ??
            (existingTemplateId ? "Saved Template" : "Blank Template"),

          // Do not use the library thumbnail as a cover photo.
          templateImageUrl: content.headerImageUrl || undefined,

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
          if (!canEditCampaign()) return;

          setSubmissionError("");
          setStep(3);
        }}
        onConfirm={handleFinalSend}
        onFinish={() => router.push("/dashboard")}
      />
    </div>
  );
}

function CreateNewsletterWizardFromParams() {
  const searchParams = useSearchParams();

  const initialTemplateId = searchParams.get("templateId");
  const startBlank = searchParams.get("blank") === "true";
  const campaignId = searchParams.get("campaignId");
  const reviewRequested = searchParams.get("mode") === "review";

  const wizardKey = JSON.stringify({
    initialTemplateId,
    startBlank,
    campaignId,
    reviewRequested,
  });

  return (
    <CreateNewsletterWizardInner
      key={wizardKey}
      initialTemplateId={initialTemplateId}
      startBlank={startBlank}
      campaignId={campaignId}
      reviewRequested={reviewRequested}
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
      <CreateNewsletterWizardFromParams />
    </Suspense>
  );
}
