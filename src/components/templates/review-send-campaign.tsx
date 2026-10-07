"use client";

import { useState } from "react";
import { Check, ChevronLeft, Send, Users } from "lucide-react";

export type DeliveryOption = "now" | "schedule" | "batches";

export interface CampaignReviewData {
  campaignName: string;
  subjectLine: string;
  audience: string;
  category: string;
  templateName: string;
  templateImageUrl?: string;
  recipientCount: number;
}

export interface CampaignSendResult {
  campaignId: string;
  status: string;
  sent: number;
  failed: number;
  remaining: number;
  processedThisRun: number;
  results?: {
    deliveryId: string;
    status: "sent" | "failed";
    error?: string;
  }[];
}

interface ReviewSendCampaignProps {
  campaign: CampaignReviewData;
  onBack: () => void;
  onConfirm: (option: DeliveryOption, scheduledAt?: string) => void;

  saving?: boolean;
  recipientsLoading?: boolean;
  recipientError?: string;
  submissionError?: string;
  submissionLocked?: boolean;
  savedCampaignId?: string | null;
  sendResult?: CampaignSendResult | null;
  onFinish?: () => void;
}

export function ReviewSendCampaign({
  campaign,
  onBack,
  onConfirm,
  saving = false,
  recipientsLoading = false,
  recipientError = "",
  submissionError = "",
  submissionLocked = false,
  savedCampaignId = null,
  sendResult = null,
  onFinish,
}: ReviewSendCampaignProps) {
  const [confirmed, setConfirmed] = useState(false);

  const canSubmit =
    confirmed &&
    !saving &&
    !recipientsLoading &&
    !recipientError &&
    !submissionLocked &&
    campaign.recipientCount > 0 &&
    Boolean(campaign.subjectLine.trim());

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-6">
      <header>
        <button
          type="button"
          onClick={onBack}
          disabled={saving || submissionLocked}
          className="flex items-center gap-1 text-sm text-gwc-text-muted disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Editor
        </button>

        <h1 className="mt-3 text-[28px] font-semibold text-gwc-navy">
          Review & Send
        </h1>

        <p className="mt-1 text-sm text-gwc-text-body">
          Review your newsletter before sending it to the selected audience.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-gwc-border/20 bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-semibold text-gwc-navy">Campaign Summary</h2>

          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-gwc-text-muted">Campaign</dt>
              <dd className="mt-1 font-semibold">
                {campaign.campaignName || "Untitled Campaign"}
              </dd>
            </div>

            <div>
              <dt className="text-gwc-text-muted">Subject</dt>
              <dd className="mt-1">{campaign.subjectLine || "No subject"}</dd>
            </div>

            <div>
              <dt className="text-gwc-text-muted">Template</dt>
              <dd className="mt-1">{campaign.templateName}</dd>
            </div>

            <div>
              <dt className="text-gwc-text-muted">Category</dt>
              <dd className="mt-1">{campaign.category}</dd>
            </div>
          </dl>

          {campaign.templateImageUrl && (
            <img
              src={campaign.templateImageUrl}
              alt="Campaign header"
              className="mt-5 max-h-48 w-full rounded-lg object-cover"
            />
          )}
        </section>

        <section className="rounded-xl border border-gwc-border/20 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-gwc-navy" />
            <h2 className="font-semibold text-gwc-navy">Audience</h2>
          </div>

          <p className="font-semibold">{campaign.audience}</p>

          <p role="status" className="mt-2 text-sm text-gwc-text-muted">
            {recipientsLoading
              ? "Checking eligible recipients…"
              : `${campaign.recipientCount.toLocaleString()} eligible recipients`}
          </p>

          {recipientError && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {recipientError}
            </p>
          )}

          <ul className="mt-4 space-y-2 text-sm text-gwc-text-body">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
              Includes subscribed members in the selected audience.
            </li>

            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0" />
              Excludes unsubscribed and bounced member records.
            </li>
          </ul>

          <p className="mt-4 text-xs text-gwc-text-muted">
            To change the audience, return to Campaign Details. Eligibility is
            checked again during sending.
          </p>
        </section>
      </div>

      <section className="rounded-xl border border-gwc-border/20 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-gwc-navy">Send Now</h2>

        <p className="mt-2 text-sm text-gwc-text-body">
          Confirmation saves the newsletter and immediately requests its first
          permitted sending batch. Provider limits and batch delays still apply.
        </p>

        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Scheduling and automatic continuation of remaining batches are not
          connected yet. If recipients remain queued, the result below will show
          that explicitly.
        </p>

        {!submissionLocked && (
          <label className="mt-5 flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              disabled={saving || recipientsLoading}
              className="mt-1"
            />
            <span>
              I have reviewed the newsletter content and selected audience, and
              approve sending this campaign to its eligible members.
            </span>
          </label>
        )}

        {submissionError && (
          <div
            role="alert"
            className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700"
          >
            <p>{submissionError}</p>

            {savedCampaignId && (
              <p className="mt-2 break-all">
                Saved campaign ID: {savedCampaignId}
              </p>
            )}
          </div>
        )}

        {sendResult && (
          <div
            role="status"
            className="mt-4 rounded-lg bg-gwc-muted-bg p-4 text-sm"
          >
            <h3 className="font-semibold">
              {sendResult.status === "SENT"
                ? "Campaign processing completed"
                : sendResult.status === "FAILED"
                  ? "Processing completed with unsuccessful deliveries"
                  : "Campaign still has queued deliveries"}
            </h3>

            <ul className="mt-3 space-y-1">
              <li>Processed this request: {sendResult.processedThisRun}</li>
              <li>Recorded sent: {sendResult.sent}</li>
              <li>Recorded failed: {sendResult.failed}</li>
              <li>Remaining queued: {sendResult.remaining}</li>
            </ul>

            <p className="mt-3 text-xs text-gwc-text-muted">
              Recorded sent reflects the SMTP helper result, not confirmed inbox
              placement.
            </p>

            {sendResult.results
              ?.filter((result) => result.error)
              .map((result) => (
                <p key={result.deliveryId} className="mt-2 text-red-700">
                  {result.error}
                </p>
              ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-gwc-border/20 pt-5">
          {!submissionLocked && (
            <>
              <button
                type="button"
                onClick={onBack}
                disabled={saving}
                className="rounded-lg border border-gwc-border/50 px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                Back to Editor
              </button>

              <button
                type="button"
                onClick={() => {
                  if (canSubmit) onConfirm("now");
                }}
                disabled={!canSubmit}
                className="flex items-center gap-2 rounded-lg bg-gwc-navy px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {saving ? "Saving and processing…" : "Confirm & Send"}
              </button>
            </>
          )}

          {submissionLocked && saving && (
            <p role="status" className="text-sm text-gwc-text-muted">
              Saving and processing… Keep this page open.
            </p>
          )}

          {submissionLocked && !saving && onFinish && (
            <button
              type="button"
              onClick={onFinish}
              className="rounded-lg bg-gwc-navy px-5 py-2.5 text-sm font-semibold text-white"
            >
              Return to Dashboard
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
