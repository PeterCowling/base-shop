// packages/ui/src/components/cms/CmsLaunchChecklist.tsx

import type { ReactElement } from "react";
import { Button, Tag } from "@ui/components/atoms";
import { Inline } from "@ui/components/atoms/primitives";
import { cn } from "@ui/utils/style";

export type CmsLaunchStatus = "complete" | "warning" | "error" | "pending";

export interface CmsLaunchChecklistItem {
  id: string;
  label: string;
  status: CmsLaunchStatus;
  /**
   * Human-readable status label (e.g. "Complete", "Needs attention").
   * Caller is responsible for localization.
   */
  statusLabel: string;
  /**
   * Label for the "fix" / action CTA for this row.
   * Caller is responsible for localization.
   */
  fixLabel?: string;
  href?: string;
  onFix?: () => void;
}

export interface CmsLaunchChecklistProps {
  items: CmsLaunchChecklistItem[];
  /**
   * Optional heading shown above the checklist.
   * If omitted, no heading is rendered.
   */
  heading?: string;
  /**
   * Label shown when all required checks are complete.
   * If omitted, the celebration message is not rendered.
   */
  readyLabel?: string;
  showReadyCelebration?: boolean;
  className?: string;
}

export function CmsLaunchChecklist({
  items,
  heading,
  readyLabel,
  showReadyCelebration = true,
  className,
}: CmsLaunchChecklistProps): ReactElement | null {
  if (!items.length) return null;

  const allComplete = items.length > 0 && items.every((i) => i.status === "complete");

  const statusVariant = (status: CmsLaunchStatus): "success" | "warning" | "destructive" | "default" => {
    if (status === "complete") return "success";
    if (status === "error") return "destructive";
    if (status === "warning") return "warning";
    return "default";
  };

  return (
    <div
      className={cn(
        "space-y-2 rounded-xl border border-border/15 bg-surface-2 px-3 py-2", /* i18n-exempt -- UI-000: CSS utility class names [ttl=2026-01-31] */
        className,
      )}
    >
      <div className="space-y-1">
        {heading ? (
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {heading}
          </p>
        ) : null}
        {showReadyCelebration && allComplete && readyLabel ? (
          <p className="text-xs font-medium text-success">
            {readyLabel}
          </p>
        ) : null}
      </div>
      <div className="space-y-1">
        {items.map((item) => (
          <Inline
            key={item.id}
            alignY="center"
            wrap
            className="justify-between gap-3 rounded-xl border border-border/15 bg-surface-2 px-3 py-2"
          >
            <span className="min-w-0 text-sm font-medium">
              {item.label}
            </span>
            <div className="flex items-center gap-2">
              <Tag className="shrink-0" variant={statusVariant(item.status)}>
                {item.statusLabel}
              </Tag>
              {item.status !== "complete" && (item.href || item.onFix) && item.fixLabel && (
                <Button
                  variant="ghost"
                  className="h-auto p-0 text-xs font-semibold underline"
                  asChild={Boolean(item.href)}
                  onClick={item.onFix}
                >
                  {item.href ? (
                    <a href={item.href}>
                      {item.fixLabel}
                    </a>
                  ) : (
                    <span>{item.fixLabel}</span>
                  )}
                </Button>
              )}
            </div>
          </Inline>
        ))}
      </div>
    </div>
  );
}

export default CmsLaunchChecklist;
