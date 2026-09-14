import { FileEdit, MailCheck, Users, SendHorizontal } from "lucide-react";
import { KPICard } from "@/components/dashboard/kpi-card";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-gwc-heading font-semibold text-3xl text-gwc-text-heading">
          Newsletter Campaigns
        </h1>
        <p className="font-gwc-body text-gwc-text-body mt-1">
          Manage and track your communications to the congregation.
        </p>
      </div>

      <div className="flex gap-6">
        <KPICard
          label="Active Drafts"
          value={12}
          icon={FileEdit}
          badge="Requires Action"
        />
        <KPICard
          label="Sent Campaigns"
          value={8}
          icon={MailCheck}
          badge="This Month"
          watermarkIcon={SendHorizontal}
          variant="navy-tint"
        />
        <KPICard
          label="Total Recipients Reached"
          value="4,250"
          icon={Users}
          badge="+4% vs Last Mo"
          variant="gold"
        />
      </div>
    </div>
  );
}
