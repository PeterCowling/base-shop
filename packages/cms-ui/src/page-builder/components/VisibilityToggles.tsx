"use client";

import { Inline } from "@acme/design-system/primitives/Inline";
import { Button } from "@acme/design-system/shadcn";
import { useTranslations } from "@acme/i18n";
import type { HistoryState } from "@acme/types";

import type { Action } from "../state";
import type { EditorFlags } from "../state/layout/types";

interface Breakpoint { id: string; label: string; min?: number; max?: number }

interface Props {
  selectedIds: string[];
  editor?: HistoryState["editor"];
  dispatch: (action: Action) => void;
  breakpoints?: Breakpoint[];
}

const VisibilityToggles = ({ selectedIds, editor, dispatch, breakpoints = [] }: Props) => {
  const t = useTranslations() as unknown as (key: string, vars?: Record<string, unknown>) => string;
  return (
    <>
      <div className="mt-1 space-y-1">
        <div className="text-xs font-semibold text-muted-foreground">{/* i18n-exempt -- PB-2413: editor-only label */}Visibility (device)</div>
        <Inline gap={1} wrap>
          {(["desktop", "tablet", "mobile"] as const).map((vp) => {
            const id = selectedIds[0]!;
            const cur = ((editor ?? {})[id]?.hidden as ("desktop"|"tablet"|"mobile")[] | undefined) ?? [];
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
                  const patch: Partial<EditorFlags> = { hidden: Array.from(set) };
                  dispatch({ type: "update-editor", id, patch });
                  try {
                    const detail = isHidden ? t("pb.toast.shownOn", { target: vp }) : t("pb.toast.hiddenOn", { target: vp });
                    window.dispatchEvent(new CustomEvent("pb-live-message", { detail: String(detail) }));
                  } catch {}
                }}
                aria-pressed={isHidden}
                aria-label={String(isHidden ? t("pb.aria.showOn", { target: vp }) : t("pb.aria.hideOn", { target: vp }))}
                title={String(isHidden ? t("pb.aria.showOn", { target: vp }) : t("pb.aria.hideOn", { target: vp }))}
              >
                {label}
              </Button>
            );
          })}
        </Inline>
      </div>

      {breakpoints.length > 0 && (
        <div className="mt-1 space-y-1">
          <div className="text-xs font-semibold text-muted-foreground">{/* i18n-exempt -- PB-2413: editor-only label */}Visibility (custom devices)</div>
          <Inline gap={1} wrap>
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
                    const patch: Partial<EditorFlags> = { hiddenDeviceIds: Array.from(set) };
                    dispatch({ type: "update-editor", id: eid, patch });
                    try {
                      const detail = isHidden ? t("pb.toast.shownOn", { target: bp.label }) : t("pb.toast.hiddenOn", { target: bp.label });
                      window.dispatchEvent(new CustomEvent("pb-live-message", { detail: String(detail) }));
                    } catch {}
                  }}
                  aria-pressed={isHidden}
                  aria-label={String(isHidden ? t("pb.aria.showOn", { target: bp.label }) : t("pb.aria.hideOn", { target: bp.label }))}
                  title={String(isHidden ? t("pb.aria.showOn", { target: bp.label }) : t("pb.aria.hideOn", { target: bp.label }))}
                >
                  {bp.label}
                </Button>
              );
            })}
          </Inline>
        </div>
      )}
    </>
  );
};

export default VisibilityToggles;
