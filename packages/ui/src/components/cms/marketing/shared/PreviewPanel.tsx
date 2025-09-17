import type { ReactNode } from "react";
import { Card, CardContent } from "../../../atoms/shadcn";
import { cn } from "../../../../utils/style";

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
  emptyLabel = "Preview not available",
}: PreviewPanelProps<TData>) {
  const content = renderPreview?.(data);

  return (
    <Card className={cn("space-y-4", className)}>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">{title}</h3>
            {description && (
              <p className="text-muted-foreground text-sm">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
        <div className="rounded-lg border bg-muted/40 p-4 text-sm">
          {content ?? (
            <pre className="text-xs text-muted-foreground">
              {data ? JSON.stringify(data, null, 2) : emptyLabel}
            </pre>
          )}
        </div>
        {footer}
      </CardContent>
    </Card>
  );
}
