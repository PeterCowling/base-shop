import type { ReactNode } from "react";
import { Tag } from "../../../atoms";
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
  statusLabel = "Scheduled",
  description,
  actions,
  footer,
}: EmailScheduleSummaryCardProps) {
  const metrics: SummaryMetric[] = [
    { label: "Send time", value: data.sendAtLabel },
    { label: "Timezone", value: data.timezone },
    {
      label: "Segment",
      value: (
        <Tag variant="success" className="text-[0.65rem]">
          {data.segment}
        </Tag>
      ),
    },
    { label: "Follow-up", value: data.followUpSummary },
  ];

  return (
    <SummaryCard
      title={data.subject}
      status={{ label: statusLabel, tone: "success" }}
      description={
        description ??
        "Monitor deliverability and click-through once the campaign sends."
      }
      metrics={metrics}
      actions={actions}
      footer={footer}
    />
  );
}

export default EmailScheduleSummaryCard;
