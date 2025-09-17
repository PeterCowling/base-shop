import type { ReactNode } from "react";
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
  const metrics: SummaryMetric[] = [
    {
      label: "Rules",
      value: `${data.rules.length} condition${data.rules.length === 1 ? "" : "s"}`,
    },
    {
      label: "Estimated size",
      value: data.estimatedSize.toLocaleString(),
    },
  ];

  return (
    <SummaryCard
      title={data.name}
      status={{ label: statusLabel, tone: "warning" }}
      description={
        description ??
        "Sync the segment with marketing tools once you're satisfied with the filters."
      }
      metrics={metrics}
      actions={actions}
      footer={footer}
    />
  );
}

export default SegmentSummaryCard;
