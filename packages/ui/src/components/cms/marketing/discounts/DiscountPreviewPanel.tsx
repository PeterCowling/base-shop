import { useTranslations } from "@acme/i18n";

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
  const t = useTranslations();
  return (
    <PreviewPanel
      title={t("Discount preview") as string}
      description={t("Visual confirmation of what customers will see.") as string}
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
              {t("Validity")}
            </span>
            <p>{preview.validity}</p>
          </div>
          <div className="space-y-1">
            <span className="text-muted-foreground text-xs uppercase">
              {t("Applies to")}
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
