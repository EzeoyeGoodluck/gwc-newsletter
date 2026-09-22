"use client";

import { useState } from "react";
import { Calendar, Check, ChevronDown, ChevronLeft, Clock, Send, Users } from "lucide-react";

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

interface ReviewSendCampaignProps {
  campaign: CampaignReviewData;
  onBack: () => void;
  onConfirm: (option: DeliveryOption, scheduledAt?: string) => void;
}

const audienceCounts: Record<string, number> = {
  "All Active Members": 1240,
  "All Members": 1240,
  "Youth Ministry": 186,
  Volunteers: 94,
  "Elders Council": 12,
  Visitors: 73,
};

export function ReviewSendCampaign({ campaign, onBack, onConfirm }: ReviewSendCampaignProps) {
  const [audience, setAudience] = useState(campaign.audience || "All Active Members");
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [delivery, setDelivery] = useState<DeliveryOption>("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const recipients = audienceCounts[audience] ?? campaign.recipientCount ?? 0;
  const audienceOptions = Object.keys(audienceCounts);

  const submit = () => {
    if (delivery === "schedule" && !scheduledAt) return;
    onConfirm(delivery, scheduledAt || undefined);
  };

  return (
    <div className="max-w-[960px] mx-auto flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-gwc-text-muted hover:text-gwc-navy cursor-pointer w-fit"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Editor
        </button>
        <h1 className="text-[28px] font-semibold text-gwc-navy tracking-tight mt-2">Review & Send</h1>
        <p className="text-sm text-gwc-text-body">Finalize delivery details for your campaign.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6">
        <div className="flex flex-col gap-5">
          <section className="bg-white border border-gwc-border/20 rounded-xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gwc-text-heading mb-4">Campaign Summary</h2>
            <div className="flex gap-3">
              <div className="h-16 w-16 rounded-lg overflow-hidden bg-gwc-muted-bg shrink-0">
                {campaign.templateImageUrl ? (
                  <img src={campaign.templateImageUrl} alt="Template preview" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-gwc-text-heading truncate">{campaign.campaignName || "Untitled Campaign"}</p>
                <p className="text-xs text-gwc-text-muted mt-1 line-clamp-2">{campaign.subjectLine || "No subject line added yet"}</p>
                <p className="text-xs text-gwc-text-muted mt-1">Template: {campaign.templateName || "Blank Template"}</p>
              </div>
            </div>
          </section>

          <section className="bg-white border border-gwc-border/20 rounded-xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gwc-text-heading">Audience Details</h2>
              <Users className="h-4 w-4 text-gwc-text-muted" />
            </div>

            <div className="relative">
              <label className="block text-xs font-medium text-gwc-text-muted mb-1.5">Send to audience</label>
              <button
                onClick={() => setAudienceOpen((value) => !value)}
                className="flex w-full items-center justify-between rounded-lg border border-gwc-border/50 bg-gwc-muted-bg px-3 py-2.5 text-sm text-gwc-text-heading cursor-pointer hover:bg-white"
              >
                {audience}
                <ChevronDown className="h-4 w-4" />
              </button>
              {audienceOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setAudienceOpen(false)} />
                  <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-gwc-border/20 bg-white py-1 shadow-lg">
                    {audienceOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setAudience(option);
                          setAudienceOpen(false);
                        }}
                        className="block w-full px-3 py-2 text-left text-sm text-gwc-text-body hover:bg-gwc-muted-bg cursor-pointer"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 rounded-lg bg-gwc-muted-bg p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gwc-navy text-xs font-semibold text-white">All</div>
                <div>
                  <p className="text-sm font-semibold text-gwc-text-heading">{audience}</p>
                  <p className="text-xs text-gwc-text-muted">{recipients.toLocaleString()} recipients</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2 text-xs text-gwc-text-body">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-gwc-navy" /> Includes members who can receive emails</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-gwc-navy" /> Excludes unsubscribed contacts</li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-gwc-navy" /> Respects communication preferences</li>
              </ul>
            </div>
          </section>
        </div>

        <section className="bg-white border border-gwc-border/20 rounded-xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gwc-text-heading mb-4">Delivery Options</h2>
          <div className="flex flex-col gap-3">
            <DeliveryCard
              selected={delivery === "now"}
              title="Send Now"
              description="Campaign will begin sending immediately upon confirmation."
              icon={<Send className="h-4 w-4" />}
              onClick={() => setDelivery("now")}
            />
            <DeliveryCard
              selected={delivery === "schedule"}
              title="Schedule for Later"
              description="Choose a specific date and time for delivery."
              icon={<Calendar className="h-4 w-4" />}
              onClick={() => setDelivery("schedule")}
            >
              {delivery === "schedule" && (
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                  className="mt-3 w-full rounded-lg border border-gwc-border/50 bg-gwc-muted-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gwc-navy/20"
                />
              )}
            </DeliveryCard>
            <DeliveryCard
              selected={delivery === "batches"}
              title="Send in Batches"
              description="Send gradually over time to protect deliverability."
              icon={<Clock className="h-4 w-4" />}
              onClick={() => setDelivery("batches")}
              badge="Recommended"
            />
          </div>

          <label className="mt-5 flex items-start gap-2 rounded-lg bg-gwc-muted-bg p-3 text-xs text-gwc-text-body cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-0.5 cursor-pointer"
            />
            <span>
              I have reviewed the recipient list, content, and delivery details. I understand this campaign will be sent to {recipients.toLocaleString()} recipients.
            </span>
          </label>

          <div className="mt-5 flex justify-end gap-3 border-t border-gwc-border/20 pt-5">
            <button
              onClick={onBack}
              className="rounded-lg border border-gwc-border/50 px-5 py-2.5 text-sm font-semibold text-gwc-text-body cursor-pointer hover:bg-gwc-muted-bg"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={!confirmed || (delivery === "schedule" && !scheduledAt)}
              className="flex items-center gap-2 rounded-lg bg-gwc-navy px-5 py-2.5 text-sm font-semibold text-white cursor-pointer hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Confirm & Send
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function DeliveryCard({
  selected,
  title,
  description,
  icon,
  badge,
  onClick,
  children,
}: {
  selected: boolean;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-lg border p-4 cursor-pointer transition-colors ${
        selected ? "border-gwc-navy bg-gwc-navy/5" : "border-gwc-border/30 hover:bg-gwc-muted-bg"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 flex h-4 w-4 items-center justify-center rounded-full border ${selected ? "border-gwc-navy" : "border-gwc-border"}`}>
          {selected && <span className="h-2 w-2 rounded-full bg-gwc-navy" />}
        </span>
        <span className="text-gwc-navy">{icon}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gwc-text-heading">{title}</p>
            {badge && <span className="rounded-full bg-gwc-gold/20 px-2 py-0.5 text-[10px] font-semibold text-gwc-gold-text">{badge}</span>}
          </div>
          <p className="mt-1 text-xs text-gwc-text-muted">{description}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
