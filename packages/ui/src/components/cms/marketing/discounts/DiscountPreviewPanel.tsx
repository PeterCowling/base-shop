import { Tag } from "../../../atoms";
import { PreviewPanel } from "../shared";
import type { DiscountPreviewData } from "./types";

export interface DiscountPreviewPanelProps {
  data: DiscountPreviewData;
  className?: string;
}

export function DiscountPreviewPanel({
  data,
  className,
}: DiscountPreviewPanelProps) {
  return (
    <PreviewPanel
      title="Discount preview"
      description="Visual confirmation of what customers will see."
      data={data}
      className={className}
      renderPreview={(preview) => (
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Tag variant="default" className="text-xs">
              {preview.code}
            </Tag>
            <span className="font-medium">{preview.label}</span>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs uppercase">
              Validity
            </span>
            <p>{preview.validity}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs uppercase">
              Applies to
            </span>
            <p>{preview.appliesTo}</p>
          </div>
          <p className="text-muted-foreground text-xs">{preview.usageLabel}</p>
        </div>
      )}
    />
  );
}

export default DiscountPreviewPanel;
