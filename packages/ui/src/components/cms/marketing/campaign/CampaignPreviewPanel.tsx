import type { ReactNode } from "react";
import { Tag } from "../../../atoms";
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
  return (
    <PreviewPanel
      title="Campaign preview"
      description="Review how the campaign will appear to stakeholders before publishing."
      data={data}
      className={className}
      actions={actions}
      renderPreview={(preview) => (
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-semibold">{preview.title}</h4>
            <Tag variant="success" className="uppercase text-xs">
              {preview.objective}
            </Tag>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs uppercase">
                Schedule
              </span>
              <p className="font-medium">{preview.timeframe}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs uppercase">
                Budget
              </span>
              <p className="font-medium">{preview.budgetLabel}</p>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs uppercase">
              Channels
            </span>
            <div className="flex flex-wrap gap-2">
              {preview.channels.map((channel) => (
                <Tag key={channel} variant="default" className="text-xs">
                  {channel}
                </Tag>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs uppercase">
              Audience summary
            </span>
            <p>{preview.audienceSummary}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs uppercase">
              Primary KPI
            </span>
            <p className="font-medium">{preview.kpi}</p>
          </div>
        </div>
      )}
    />
  );
}

export default CampaignPreviewPanel;
