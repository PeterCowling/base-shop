"use client";

import type { HistoryState } from "@acme/types";
import type { Action } from "../state";
import { Button } from "../../../atoms/shadcn";

interface Breakpoint { id: string; label: string; min?: number; max?: number }

interface Props {
  selectedIds: string[];
  editor?: HistoryState["editor"];
  dispatch: (action: Action) => void;
  breakpoints?: Breakpoint[];
}

const VisibilityToggles = ({ selectedIds, editor, dispatch, breakpoints = [] }: Props) => {
  return (
    <>
      <div className="mt-1 space-y-1">
        <div className="text-xs font-semibold text-muted-foreground">Visibility (device)</div>
        <div className="flex flex-wrap gap-1">
          {(["desktop", "tablet", "mobile"] as const).map((vp) => {
            const id = selectedIds[0]!;
            const cur = (editor ?? {})[id]?.hidden ?? [];
            const isHidden = cur.includes(vp);
            const label = vp.charAt(0).toUpperCase() + vp.slice(1);
            return (
              <Button
                key={vp}
                type="button"
                variant={isHidden ? "default" : "outline"}
                className="h-7 px-2 text-xs"
                onClick={() => {
                  const set = new Set(cur);
                  if (isHidden) set.delete(vp); else set.add(vp);
                  dispatch({ type: "update-editor", id, patch: { hidden: Array.from(set) } as any });
                  try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: `${isHidden ? 'Shown' : 'Hidden'} on ${vp}` })); } catch {}
                }}
                aria-pressed={isHidden}
                aria-label={`${isHidden ? 'Show' : 'Hide'} on ${vp}`}
                title={`${isHidden ? 'Show' : 'Hide'} on ${vp}`}
              >
                {label}
              </Button>
            );
          })}
        </div>
      </div>

      {breakpoints.length > 0 && (
        <div className="mt-1 space-y-1">
          <div className="text-xs font-semibold text-muted-foreground">Visibility (custom devices)</div>
          <div className="flex flex-wrap gap-1">
            {breakpoints.map((bp) => {
              const eid = selectedIds[0]!;
              const cur = ((editor ?? {})[eid]?.hiddenDeviceIds as string[] | undefined) ?? [];
              const isHidden = cur.includes(bp.id);
              const btnId = `bp-${bp.id}`;
              return (
                <Button
                  key={btnId}
                  type="button"
                  variant={isHidden ? "default" : "outline"}
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    const set = new Set(cur);
                    if (isHidden) set.delete(bp.id); else set.add(bp.id);
                    dispatch({ type: "update-editor", id: eid, patch: { hiddenDeviceIds: Array.from(set) } as any });
                    try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: `${isHidden ? 'Shown' : 'Hidden'} on ${bp.label}` })); } catch {}
                  }}
                  aria-pressed={isHidden}
                  aria-label={`${isHidden ? 'Show' : 'Hide'} on ${bp.label}`}
                  title={`${isHidden ? 'Show' : 'Hide'} on ${bp.label}`}
                >
                  {bp.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default VisibilityToggles;

