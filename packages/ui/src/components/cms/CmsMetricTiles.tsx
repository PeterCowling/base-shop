// packages/ui/src/components/cms/CmsMetricTiles.tsx

import type { ReactElement } from "react";

import { cn } from "../../utils/style";

export interface CmsMetricTile {
  id: string;
  label: string;
  value: string;
  caption?: string;
}

export interface CmsMetricTilesProps {
  items: CmsMetricTile[];
  className?: string;
}

export function CmsMetricTiles({
  items,
  className,
}: CmsMetricTilesProps): ReactElement | null {
  if (!items.length) return null;
  return (
    <div
      className={cn(
        "grid gap-3 sm:grid-cols-2 lg:grid-cols-3", /* i18n-exempt -- UI-000: CSS utility class names [ttl=2026-01-31] */
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-2xl border border-border/10 bg-surface-2 px-4 py-3 shadow-elevation-1"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {item.label}
          </p>
          <p className="text-xl font-semibold text-foreground">
            {item.value}
          </p>
          {item.caption ? (
            <p className="text-xs text-muted-foreground">
              {item.caption}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default CmsMetricTiles;
