import type { ReactNode } from "react";

import { useTranslations } from "@acme/i18n";

import { Inline } from "../../../atoms/primitives";
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
  statusLabel,
  statusTone = "warning",
  description,
  footer,
  actions,
}: CampaignSummaryCardProps) {
  const t = useTranslations();
  const statusLabelText = (statusLabel ?? (t("campaign.summary.status.draft") as string)) as string;
  const metrics: SummaryMetric[] = [
    { label: t("campaign.labels.schedule") as string, value: data.timeframe },
    { label: t("campaign.labels.budget") as string, value: data.budgetLabel },
    {
      label: t("campaign.labels.channels") as string,
      value: (
        <Inline gap={2}>
          {data.channels.map((channel) => (
            <Tag key={channel} variant="default" className="text-xs">
              {channel}
            </Tag>
          ))}
        </Inline>
      ),
    },
    { label: t("campaign.labels.primaryKpi") as string, value: data.kpi },
  ];

  return (
    <SummaryCard
      title={data.title}
      description={
        description ?? (t("campaign.summary.description") as string)
      }
      status={{ label: statusLabelText as string, tone: statusTone }}
      metrics={metrics}
      footer={footer}
      actions={actions}
    />
  );
}

export default CampaignSummaryCard;
