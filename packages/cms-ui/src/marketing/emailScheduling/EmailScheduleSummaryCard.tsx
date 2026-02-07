import type { ReactNode } from "react";

import { Tag } from "@acme/design-system/atoms";
import { useTranslations } from "@acme/i18n";

import { SummaryCard, type SummaryMetric } from "../shared";

import type { EmailSchedulePreviewData } from "./types";

export interface EmailScheduleSummaryCardProps {
  data: EmailSchedulePreviewData;
  statusLabel?: string;
  description?: string;
  actions?: ReactNode;
  footer?: ReactNode;
}

export function EmailScheduleSummaryCard({
  data,
  statusLabel,
  description,
  actions,
  footer,
}: EmailScheduleSummaryCardProps) {
  const t = useTranslations();
  const metrics: SummaryMetric[] = [
    { label: t("emailScheduling.summary.sendTimeLabel") as string, value: data.sendAtLabel },
    { label: t("emailScheduling.summary.timezoneLabel") as string, value: data.timezone },
    {
      label: t("emailScheduling.summary.segmentLabel") as string,
      value: (
        <Tag variant="success" className="text-xs">
          {data.segment}
        </Tag>
      ),
    },
    { label: t("emailScheduling.summary.followUpLabel") as string, value: data.followUpSummary },
  ];

  return (
    <SummaryCard
      title={data.subject}
      status={{ label: statusLabel ?? (t("emailScheduling.summary.status.scheduled") as string), tone: "success" }}
      description={
        description ?? (t("emailScheduling.summary.defaultDescription") as string)
      }
      metrics={metrics}
      actions={actions}
      footer={footer}
    />
  );
}

export default EmailScheduleSummaryCard;
