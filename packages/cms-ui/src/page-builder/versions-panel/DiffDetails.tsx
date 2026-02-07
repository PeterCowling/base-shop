"use client";

import { Button } from "@acme/design-system/shadcn";
import type { PageComponent } from "@acme/types";

import type { DiffSummary } from "./diff";
import { replaceComponentById } from "./diff";

interface Props {
  diff: DiffSummary | null;
  current: PageComponent[];
  onRestore: (components: PageComponent[]) => void;
}

const DiffDetails = ({ diff, current, onRestore }: Props) => {
  if (!diff || (diff.modifiedList?.length ?? 0) === 0) return null;
  return (
    <div className="rounded border bg-background p-2 text-sm space-y-2">
      <div className="text-sm font-medium">Detailed Diff{/* i18n-exempt -- PB-1023 */}</div>
      {diff.modifiedList!.slice(0, 5).map((m) => {
        const before = (diff.a as Record<string, PageComponent>)[m.id] ?? ({} as PageComponent);
        const after = (diff.b as Record<string, PageComponent>)[m.id] ?? ({} as PageComponent);
        return (
          <div key={m.id} className="border rounded p-2">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-medium">{m.id}</div>
              <Button
                variant="outline"
                onClick={() => {
                  const replacement = (diff.b as Record<string, PageComponent>)[m.id] as PageComponent | undefined;
                  const next = replaceComponentById(current, m.id, replacement);
                  onRestore(next);
                }}
              >
                {/* i18n-exempt -- PB-1023 */}Restore this component
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded border p-2">
                <div className="font-medium mb-1">Current{/* i18n-exempt -- PB-1023 */}</div>
                {m.keys.map((k) => (
                  <div key={k} className="mb-1">
                    <span className="me-1 text-muted-foreground">{k}:</span>
                    <span className="bg-destructive/10 dark:bg-destructive/30 px-1 rounded break-words">{JSON.stringify((before as Record<string, unknown>)[k])}</span>
                  </div>
                ))}
              </div>
              <div className="rounded border p-2">
                <div className="font-medium mb-1">Selected{/* i18n-exempt -- PB-1023 */}</div>
                {m.keys.map((k) => (
                  <div key={k} className="mb-1">
                    <span className="me-1 text-muted-foreground">{k}:</span>
                    <span className="bg-primary/10 dark:bg-primary/30 px-1 rounded break-words">{JSON.stringify((after as Record<string, unknown>)[k])}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DiffDetails;
