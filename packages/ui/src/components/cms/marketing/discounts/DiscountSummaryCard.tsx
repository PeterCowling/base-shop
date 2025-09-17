import type { ReactNode } from "react";
import { Tag } from "../../../atoms";
import { SummaryCard, type SummaryMetric } from "../shared";
import type { DiscountPreviewData } from "./types";

export interface DiscountSummaryCardProps {
  data: DiscountPreviewData;
  statusLabel?: string;
  description?: string;
  actions?: ReactNode;
  footer?: ReactNode;
}

export function DiscountSummaryCard({
  data,
  statusLabel = "Active",
  description,
  actions,
  footer,
}: DiscountSummaryCardProps) {
  const metrics: SummaryMetric[] = [
    { label: "Offer", value: data.label },
    { label: "Validity", value: data.validity },
    { label: "Usage", value: data.usageLabel },
    {
      label: "Applies to",
      value: (
        <Tag variant="default" className="text-[0.65rem]">
          {data.appliesTo}
        </Tag>
      ),
    },
  ];

  return (
    <SummaryCard
      title={data.code}
      status={{ label: statusLabel, tone: "success" }}
      description={
        description ??
        "Keep an eye on redemptions to ensure margin targets are protected."
      }
      metrics={metrics}
      actions={actions}
      footer={footer}
    />
  );
}

export default DiscountSummaryCard;
