import { Tag } from "../../../atoms";
import { PreviewPanel } from "../shared";
import type { EmailSchedulePreviewData } from "./types";

export interface EmailSchedulePreviewPanelProps {
  data: EmailSchedulePreviewData;
  className?: string;
}

export function EmailSchedulePreviewPanel({
  data,
  className,
}: EmailSchedulePreviewPanelProps) {
  return (
    <PreviewPanel
      title="Email scheduling"
      description="A quick snapshot of your upcoming send."
      data={data}
      className={className}
      renderPreview={(preview) => (
        <div className="space-y-3 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs uppercase">
              Subject
            </span>
            <p className="text-base font-medium">{preview.subject}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs uppercase">
                Scheduled for
              </span>
              <p>{preview.sendAtLabel}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs uppercase">
                Timezone
              </span>
              <Tag variant="default" className="text-xs">
                {preview.timezone}
              </Tag>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs uppercase">
              Segment
            </span>
            <Tag variant="success" className="text-xs">
              {preview.segment}
            </Tag>
          </div>
          <p className="text-muted-foreground text-xs">
            {preview.followUpSummary}
          </p>
        </div>
      )}
    />
  );
}

export default EmailSchedulePreviewPanel;
