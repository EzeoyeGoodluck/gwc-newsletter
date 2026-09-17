export type CampaignStatus = "draft" | "scheduled" | "sent";

export interface Campaign {
  id: string;
  title: string;
  status: CampaignStatus;
  category: string;
  lastEdited: string;
}

export interface DashboardMetrics {
  activeDrafts: number;
  sentThisMonth: number;
  totalRecipients: number;
  recipientsChangePercent?: number;
}

export interface CampaignsResponse {
  campaigns: Campaign[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CampaignsQuery {
  status?: CampaignStatus | "all";
  categories?: string[];
  search?: string;
  page?: number;
}
