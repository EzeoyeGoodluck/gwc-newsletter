import { Campaign } from "@/lib/types/dashboard";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { CampaignActions } from "@/components/dashboard/campaign-actions";
import { CategoryTag } from "@/components/dashboard/category-tag";

interface CampaignsTableProps {
  campaigns: Campaign[];
  onAction: (action: string, campaign: Campaign) => void;
}

export function CampaignsTable({ campaigns, onAction }: CampaignsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gwc-border/20 text-left text-gwc-text-muted">
            <th className="py-3 px-4 font-gwc-heading font-semibold">
              Campaign Title
            </th>
            <th className="py-3 px-4 font-gwc-heading font-semibold">Status</th>
            <th className="py-3 px-4 font-gwc-heading font-semibold">
              Category
            </th>
            <th className="py-3 px-4 font-gwc-heading font-semibold">
              Last Edited
            </th>
            <th className="py-3 px-4 pr-6 font-gwc-heading font-semibold text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign) => (
            <tr
              key={campaign.id}
              className="border-b border-gwc-border/10 hover:bg-gwc-muted-bg/50"
            >
              <td className="py-3 px-4">
                <p className="font-medium text-gwc-text-heading">
                  {campaign.title}
                </p>
                <p className="text-xs text-gwc-text-muted/70 mt-0.5">
                  ID: {campaign.campaignId}
                </p>
              </td>
              <td className="py-3 px-4">
                <StatusBadge status={campaign.status} />
              </td>
              <td className="py-3 px-4">
                <CategoryTag category={campaign.category} />
              </td>
              <td className="py-3 px-4 text-gwc-text-muted">
                {campaign.lastEdited}
              </td>
              <td className="py-3 px-4 pr-6 text-right">
                <CampaignActions campaign={campaign} onAction={onAction} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
