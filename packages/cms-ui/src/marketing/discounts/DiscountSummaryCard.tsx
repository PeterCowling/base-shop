import type { ReactNode } from "react";

import { Tag } from "@acme/design-system/atoms";
import { useTranslations } from "@acme/i18n";

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
  statusLabel,
  description,
  actions,
  footer,
}: DiscountSummaryCardProps) {
  const t = useTranslations();
  const metrics: SummaryMetric[] = [
    { label: t("Offer") as string, value: data.label },
    { label: t("Validity") as string, value: data.validity },
    { label: t("Usage") as string, value: data.usageLabel },
    {
      label: t("Applies to") as string,
      value: (
        <Tag variant="default" className="text-xs">
          {data.appliesTo}
        </Tag>
      ),
    },
  ];

  return (
    <SummaryCard
      title={data.code}
      status={{ label: statusLabel ?? (t("Active") as string), tone: "success" }}
      description={
        description ??
        (t("Keep an eye on redemptions to ensure margin targets are protected.") as string)
      }
      metrics={metrics}
      actions={actions}
      footer={footer}
    />
  );
}

export default DiscountSummaryCard;
