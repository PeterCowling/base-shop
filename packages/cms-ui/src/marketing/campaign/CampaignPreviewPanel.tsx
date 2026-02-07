import type { ReactNode } from "react";

import { Tag } from "@acme/design-system/atoms";
import { Inline, Stack } from "@acme/design-system/primitives";
import { useTranslations } from "@acme/i18n";

import { PreviewPanel } from "../shared";

import type { CampaignPreviewData } from "./types";

export interface CampaignPreviewPanelProps {
  data: CampaignPreviewData;
  className?: string;
  actions?: ReactNode;
}

export function CampaignPreviewPanel({
  data,
  className,
  actions,
}: CampaignPreviewPanelProps) {
  const t = useTranslations();
  return (
    <PreviewPanel
      title={t("Campaign preview") as string}
      description={
        t(
          "Review how the campaign will appear to stakeholders before publishing."
        ) as string
      }
      data={data}
      className={className}
      actions={actions}
      renderPreview={(preview) => (
        <Stack gap={3} className="text-sm">
          <Inline gap={2} alignY="center">
            <h4 className="text-base font-semibold">{preview.title}</h4>
            <Tag variant="success" className="uppercase text-xs">
              {preview.objective}
            </Tag>
          </Inline>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs uppercase">
                {t("Schedule")}
              </span>
              <p className="font-medium">{preview.timeframe}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs uppercase">
                {t("Budget")}
              </span>
              <p className="font-medium">{preview.budgetLabel}</p>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs uppercase">
              {t("Channels")}
            </span>
            <Inline gap={2}>
              {preview.channels.map((channel) => (
                <Tag key={channel} variant="default" className="text-xs">
                  {channel}
                </Tag>
              ))}
            </Inline>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs uppercase">
              {t("Audience summary")}
            </span>
            <p>{preview.audienceSummary}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs uppercase">
              {t("Primary KPI")}
            </span>
            <p className="font-medium">{preview.kpi}</p>
          </div>
        </Stack>
      )}
    />
  );
}

export default CampaignPreviewPanel;
