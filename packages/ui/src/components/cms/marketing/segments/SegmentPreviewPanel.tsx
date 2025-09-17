import { Card, CardContent } from "../../../atoms/shadcn";
import { Tag } from "../../../atoms";
import { PreviewPanel } from "../shared";
import type { SegmentPreviewData } from "./types";

export interface SegmentPreviewPanelProps {
  data: SegmentPreviewData;
  className?: string;
}

export function SegmentPreviewPanel({
  data,
  className,
}: SegmentPreviewPanelProps) {
  return (
    <PreviewPanel
      title="Segment snapshot"
      description="Preview the rules applied to this audience."
      data={data}
      className={className}
      renderPreview={(preview) => (
        <div className="space-y-3 text-sm">
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs uppercase">
              Estimated size
            </span>
            <p className="text-base font-semibold">
              {preview.estimatedSize.toLocaleString()} people
            </p>
          </div>
          <div className="space-y-2">
            <span className="text-muted-foreground text-xs uppercase">
              Filters
            </span>
            <div className="space-y-2">
              {preview.rules.map((rule) => (
                <Card key={rule.id} className="border-dashed">
                  <CardContent className="flex flex-wrap items-center gap-2 text-xs">
                    <Tag variant="default">{rule.attribute}</Tag>
                    <span>{rule.operator}</span>
                    <Tag variant="success">{rule.value}</Tag>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    />
  );
}

export default SegmentPreviewPanel;
