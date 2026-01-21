import type { ReactNode } from "react";

import { useTranslations } from "@acme/i18n";

import { cn } from "../../../../utils/style";
import { Inline, Stack } from "../../../atoms/primitives";
import { Card, CardContent } from "../../../atoms/shadcn";
import { CodeBlock } from "../../../molecules";

export interface PreviewPanelProps<TData> {
  title: string;
  description?: string;
  data: TData;
  /** Optional renderer for the preview body. Defaults to JSON output. */
  renderPreview?: (data: TData) => ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
  className?: string;
  emptyLabel?: string;
}

export function PreviewPanel<TData>({
  title,
  description,
  data,
  renderPreview,
  footer,
  actions,
  className,
  emptyLabel,
}: PreviewPanelProps<TData>) {
  const t = useTranslations();
  const content = renderPreview?.(data);
  const fallbackPreview = data
    ? JSON.stringify(data, null, 2)
    : String(emptyLabel ?? t("cms.preview.notAvailable"));

  const previewBody = content ? (
    <div className="p-4">{content}</div>
  ) : (
    <CodeBlock
      code={fallbackPreview}
      className="p-4"
      /* i18n-exempt -- DS-000 presentation-only class string [ttl=2026-01-01] */
      preClassName="bg-transparent text-xs text-muted-foreground border-none p-0 pe-12"
    />
  );

  return (
    <Card className={cn("space-y-4", className)}>
      <CardContent className="space-y-4">
        <Inline className="justify-between items-start gap-3">
          <Stack className="space-y-1">
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && (
              <p className="text-muted-foreground text-sm">{description}</p>
            )}
          </Stack>
          {actions && <Inline className="items-center gap-2">{actions}</Inline>}
        </Inline>
        <div className="rounded-lg border bg-muted/40 text-sm">{previewBody}</div>
        {footer}
      </CardContent>
    </Card>
  );
}
