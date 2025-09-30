import type { ReactNode } from "react";
import { useTranslations } from "@acme/i18n";
import { SummaryCard, type SummaryMetric } from "../shared";
import type { SegmentPreviewData } from "./types";

export interface SegmentSummaryCardProps {
  data: SegmentPreviewData;
  statusLabel?: string;
  description?: string;
  actions?: ReactNode;
  footer?: ReactNode;
}

export function SegmentSummaryCard({
  data,
  statusLabel = "Draft",
  description,
  actions,
  footer,
}: SegmentSummaryCardProps) {
  const t = useTranslations();
  const metrics: SummaryMetric[] = [
    {
      label: t("Rules") as string,
      value: `${data.rules.length} ${t(
        data.rules.length === 1 ? "condition" : "conditions"
      )}`,
    },
    {
      label: t("Estimated size") as string,
      value: data.estimatedSize.toLocaleString(),
    },
  ];

  return (
    <SummaryCard
      title={data.name || (t("cms.marketing.segments.preview.untitled") as string)}
      status={{ label: (t(statusLabel) as string), tone: "warning" }}
      description={
        description ??
        (t(
          "Sync the segment with marketing tools once you're satisfied with the filters."
        ) as string)
      }
      metrics={metrics}
      actions={actions}
      footer={footer}
    />
  );
}

export default SegmentSummaryCard;
