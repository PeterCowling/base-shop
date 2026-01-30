"use client";

import { Button } from "@acme/design-system/atoms";

export interface ConflictDialogProps {
  currentMarkdown: string;
  submittedMarkdown: string;
  isBusy: boolean;
  onRefresh: () => void;
  onOverwrite: () => void;
}

export function ConflictDialog({
  currentMarkdown,
  submittedMarkdown,
  isBusy,
  onRefresh,
  onOverwrite,
}: ConflictDialogProps) {
  return (
    <div className="rounded-md border border-warning bg-warning-soft p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-warning-foreground">
          {/* i18n-exempt -- BOS-32 Phase 0 optimistic concurrency copy [ttl=2026-03-31] */}
          Conflict detected: someone changed this card after you opened it.
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onRefresh} disabled={isBusy}>
            {/* i18n-exempt -- BOS-32 Phase 0 optimistic concurrency copy [ttl=2026-03-31] */}
            Refresh
          </Button>
          <Button type="button" onClick={onOverwrite} disabled={isBusy}>
            {/* i18n-exempt -- BOS-32 Phase 0 optimistic concurrency copy [ttl=2026-03-31] */}
            Overwrite Anyway
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">
            {/* i18n-exempt -- BOS-32 Phase 0 optimistic concurrency copy [ttl=2026-03-31] */}
            Current (latest)
          </div>
          <pre className="max-h-64 overflow-auto rounded bg-background p-3 text-xs text-foreground">
            {currentMarkdown}
          </pre>
        </div>
        <div>
          <div className="mb-2 text-xs font-medium text-muted-foreground">
            {/* i18n-exempt -- BOS-32 Phase 0 optimistic concurrency copy [ttl=2026-03-31] */}
            Yours (submitted)
          </div>
          <pre className="max-h-64 overflow-auto rounded bg-background p-3 text-xs text-foreground">
            {submittedMarkdown}
          </pre>
        </div>
      </div>
    </div>
  );
}
