export type CampaignStatus = "draft" | "scheduled" | "sent";

export interface StoredCampaign {
  id: string;
  campaignId: string;
  title: string;
  status: CampaignStatus;
  category: string;
  audience: string;
  lastEdited: string;
}

export interface NewCampaignInput {
  title: string;
  category: string;
  status: CampaignStatus;
  audience: string;
}

const STORAGE_KEY = "gwc_newsletter_campaigns";

function generateCampaignId(existing: StoredCampaign[]): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  const seq = existing.length + 1;
  const letter = String.fromCharCode(65 + (seq % 26));
  return `CMP-${year}-${month}-${letter}`;
}

export function getStoredCampaigns(): StoredCampaign[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addCampaign(input: NewCampaignInput): StoredCampaign {
  const existing = getStoredCampaigns();
  const campaign: StoredCampaign = {
    id: crypto.randomUUID(),
    campaignId: generateCampaignId(existing),
    title: input.title,
    status: input.status,
    category: input.category,
    audience: input.audience,
    lastEdited: "Just now",
  };
  const updated = [campaign, ...existing];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return campaign;
}

export function removeCampaign(id: string): void {
  const existing = getStoredCampaigns();
  const updated = existing.filter((c) => c.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
