"use client";

import { ChevronLeft, Send, Save } from "lucide-react";

export interface NewsletterContent {
  subjectLine: string;
  headerImageUrl: string;
  bodyText: string;
}

interface CreateNewsletterStepThreeProps {
  campaignName: string;
  content: NewsletterContent;
  onContentChange: (content: NewsletterContent) => void;
  onBack: () => void;
  onSaveDraft: () => void;
  onSend: () => void;
}

export function CreateNewsletterStepThree({
  campaignName,
  content,
  onContentChange,
  onBack,
  onSaveDraft,
  onSend,
}: CreateNewsletterStepThreeProps) {
  const update = <K extends keyof NewsletterContent>(
    key: K,
    value: NewsletterContent[K]
  ) => {
    onContentChange({ ...content, [key]: value });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-gwc-text-muted cursor-pointer hover:text-gwc-navy w-fit"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Campaign Details
          </button>
          <h1 className="text-[28px] font-semibold text-gwc-navy tracking-tight">
            {campaignName || "Untitled Campaign"}
          </h1>
          <p className="text-sm text-gwc-text-body">
            Step 3 of 3 — Compose your message.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onSaveDraft}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-gwc-text-body border border-gwc-border/50 cursor-pointer hover:bg-gwc-muted-bg"
          >
            <Save className="h-4 w-4" />
            Save Draft
          </button>
          <button
            onClick={onSend}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-gwc-gold text-gwc-gold-text cursor-pointer hover:brightness-95"
          >
            <Send className="h-4 w-4" />
            Send Newsletter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gwc-border/20 p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-gwc-text-body">
              Subject Line
            </label>
            <input
              value={content.subjectLine}
              onChange={(e) => update("subjectLine", e.target.value)}
              className="border border-gwc-border/50 rounded-lg px-4 py-3 text-[15px] text-gwc-navy bg-gwc-muted-bg focus:outline-none focus:ring-2 focus:ring-gwc-navy/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-gwc-text-body">
              Header Image URL
            </label>
            <input
              value={content.headerImageUrl}
              onChange={(e) => update("headerImageUrl", e.target.value)}
              placeholder="https://..."
              className="border border-gwc-border/50 rounded-lg px-4 py-3 text-[15px] text-gwc-navy bg-gwc-muted-bg focus:outline-none focus:ring-2 focus:ring-gwc-navy/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-gwc-text-body">
              Message Body
            </label>
            <textarea
              value={content.bodyText}
              onChange={(e) => update("bodyText", e.target.value)}
              rows={14}
              className="border border-gwc-border/50 rounded-lg px-4 py-4 text-[15px] text-gwc-navy bg-gwc-muted-bg resize-none focus:outline-none focus:ring-2 focus:ring-gwc-navy/20 leading-relaxed"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gwc-border/20 overflow-hidden flex flex-col h-fit sticky top-6">
          <div className="bg-gwc-navy px-6 py-5 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-xs font-bold text-gwc-navy">
              GW
            </div>
            <span className="text-white text-sm font-semibold">
              Glory Worship Church
            </span>
          </div>

          {content.headerImageUrl && (
            <img
              src={content.headerImageUrl}
              alt="Header"
              className="w-full h-40 object-cover"
            />
          )}

          <div className="px-6 py-6 flex flex-col gap-3">
            <p className="text-sm font-semibold text-gwc-text-heading">
              {content.subjectLine || "(Your subject line)"}
            </p>
            <p className="text-sm text-gwc-text-body leading-relaxed whitespace-pre-wrap">
              {content.bodyText ||
                "Your message body will appear here as you type."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
