import type { ReactNode } from "react";
import { Tag, type TagProps } from "../../../atoms/shadcn";
import { SummaryCard, type SummaryMetric } from "../shared";
import type { CampaignPreviewData } from "./types";

export interface CampaignSummaryCardProps {
  data: CampaignPreviewData;
  statusLabel?: string;
  statusTone?: TagProps["variant"];
  description?: string;
  footer?: ReactNode;
  actions?: ReactNode;
}

export function CampaignSummaryCard({
  data,
  statusLabel = "Draft",
  statusTone = "warning",
  description,
  footer,
  actions,
}: CampaignSummaryCardProps) {
  const metrics: SummaryMetric[] = [
    { label: "Schedule", value: data.timeframe },
    { label: "Budget", value: data.budgetLabel },
    {
      label: "Channels",
      value: (
        <div className="flex flex-wrap gap-2">
          {data.channels.map((channel) => (
            <Tag key={channel} variant="default" className="text-[0.65rem]">
              {channel}
            </Tag>
          ))}
        </div>
      ),
    },
    { label: "Primary KPI", value: data.kpi },
  ];

  return (
    <SummaryCard
      title={data.title}
      description={
        description ??
        "Finalize the campaign plan and share with stakeholders before activating."
      }
      status={{ label: statusLabel, tone: statusTone }}
      metrics={metrics}
      footer={footer}
      actions={actions}
    />
  );
}

export default CampaignSummaryCard;
