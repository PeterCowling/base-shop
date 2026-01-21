// packages/ui/src/components/cms/CmsSettingsSnapshot.tsx

import type { ReactElement } from "react";

import { Card, CardContent } from "../../components/atoms/shadcn";
import { cn } from "../../utils/style";

export type CmsSettingsTone = "default" | "warning" | "error" | "success";

export interface CmsSettingsSnapshotRow {
  id: string;
  label: string;
  value: string;
  tone?: CmsSettingsTone;
}

export interface CmsSettingsSnapshotProps {
  title?: string;
  body?: string;
  rows: CmsSettingsSnapshotRow[];
  className?: string;
}

export function CmsSettingsSnapshot({
  title,
  body,
  rows,
  className,
}: CmsSettingsSnapshotProps): ReactElement {
  return (
    <Card
      className={cn(
        "border border-border/10 bg-surface-2 text-foreground shadow-elevation-4", /* i18n-exempt -- UI-000: CSS utility class names [ttl=2026-01-31] */
        className,
      )}
    >
      <CardContent className="space-y-5 p-6">
        {(title || body) && (
          <div className="space-y-1">
            {title ? (
              <h2 className="text-lg font-semibold">{title}</h2>
            ) : null}
            {body ? (
              <p className="text-sm text-muted-foreground">
                {body}
              </p>
            ) : null}
          </div>
        )}
        <dl className="space-y-3 text-sm text-muted-foreground">
          {rows.map((row) => (
            <div key={row.id} className="space-y-1">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {row.label}
              </dt>
              <dd
                className={cn(
                  "text-sm font-medium", /* i18n-exempt -- UI-000: CSS utility class names [ttl=2026-01-31] */
                  row.tone === "warning" && "text-warning-foreground",
                  row.tone === "error" && "text-destructive-foreground",
                  row.tone === "success" && "text-success-foreground",
                )}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

export default CmsSettingsSnapshot;
