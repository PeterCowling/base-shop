import type { ReactNode } from "react";
import { Tag, type TagProps } from "../../../atoms/shadcn";
import { SummaryCard, type SummaryMetric } from "../shared";
import type { CampaignPreviewData } from "./types";
import { Inline } from "../../../atoms/primitives";
import { useTranslations } from "@acme/i18n";

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
  const t = useTranslations();
  const metrics: SummaryMetric[] = [
    { label: t("Schedule") as string, value: data.timeframe },
    { label: t("Budget") as string, value: data.budgetLabel },
    {
      label: t("Channels") as string,
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
    { label: t("Primary KPI") as string, value: data.kpi },
  ];

  return (
    <SummaryCard
      title={data.title}
      description={
        description ??
        (t(
          "Finalize the campaign plan and share with stakeholders before activating."
        ) as string)
      }
      status={{ label: t(statusLabel) as string, tone: statusTone }}
      metrics={metrics}
      footer={footer}
      actions={actions}
    />
  );
}

export default CampaignSummaryCard;
