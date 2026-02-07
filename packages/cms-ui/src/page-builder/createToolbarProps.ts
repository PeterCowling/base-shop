import type { Dispatch } from "react";

import type { HistoryState } from "@acme/types";
import type { UploadProgress } from "@acme/ui/hooks/useFileUpload";

import { buildToolbarProps } from "./buildProps";
import type usePageBuilderControls from "./hooks/usePageBuilderControls";
import { type GlobalItem,listGlobals, updateGlobal } from "./libraryStore";
import type { PageBuilderProps } from "./PageBuilder.types";
import type { Breakpoint } from "./panels/BreakpointsPanel";
import type { Action } from "./state";
import type { EditorFlags } from "./state/layout/types";
/* i18n-exempt file -- PB-2418: helper; no user-facing strings */

interface ToolbarOptions {
  controls: ReturnType<typeof usePageBuilderControls>;
  selectedIds: string[];
  state: HistoryState;
  dispatch: Dispatch<Action>;
  shop?: string | null;
  progress: UploadProgress | null;
  isValid: boolean | null;
  locales: typeof import("@acme/i18n/locales").locales;
  pagesNav?: PageBuilderProps["pagesNav"];
}

type EditorFlagsWithGlobals = EditorFlags & { globalBreakpoints?: Breakpoint[] };
type LayoutState = HistoryState & { breakpoints?: Breakpoint[] };

const mapWidth = (bp: { min?: number; max?: number }): number => {
  const base =
    typeof bp.max === "number" && bp.max > 0
      ? bp.max
      : typeof bp.min === "number"
        ? bp.min
        : 1024;
  return Math.max(320, Math.min(1920, base));
};

const toDeviceType = (width: number): "desktop" | "tablet" | "mobile" => {
  if (width >= 1024) return "desktop";
  if (width >= 768) return "tablet";
  return "mobile";
};

const getSelectedFlags = (state: HistoryState, selectedIds: string[]) => {
  const sel = selectedIds[0];
  if (!sel) return null;
  const editor = state.editor ?? {};
  return editor[sel] ?? null;
};

const resolveBreakpoints = (
  state: HistoryState,
  selectedIds: string[],
  shop?: string | null,
): Breakpoint[] => {
  const flags = getSelectedFlags(state, selectedIds) as EditorFlagsWithGlobals | null;
  const isGlobal = !!flags?.global?.id;
  if (!isGlobal) return ((state as LayoutState).breakpoints ?? []) as Breakpoint[];

  if (Array.isArray(flags?.globalBreakpoints)) {
    return flags.globalBreakpoints as Breakpoint[];
  }

  const gid = String(flags.global?.id || "");
  if (!gid) return [];

  try {
    const globalItems = listGlobals(shop);
    const found = globalItems.find((g) => g.globalId === gid) as GlobalItem | undefined;
    return (found?.breakpoints ?? []) as Breakpoint[];
  } catch {
    return [];
  }
};

const resolveExtraDevices = (
  controls: ReturnType<typeof usePageBuilderControls>,
  state: HistoryState,
  selectedIds: string[],
  shop?: string | null,
): ReturnType<typeof usePageBuilderControls>["extraDevices"] => {
  const pageExtra = controls.extraDevices || [];
  const flags = getSelectedFlags(state, selectedIds) as EditorFlagsWithGlobals | null;
  const isGlobal = !!flags?.global?.id;
  let globalBreakpoints: Breakpoint[] = isGlobal ? (flags?.globalBreakpoints ?? []) : [];

  if (isGlobal && (!globalBreakpoints || globalBreakpoints.length === 0)) {
    try {
      const gid = String(flags?.global?.id || "");
      const found = listGlobals(shop).find((i) => i.globalId === gid) as GlobalItem | undefined;
      globalBreakpoints = (found?.breakpoints ?? []) as Breakpoint[];
    } catch {
      globalBreakpoints = [];
    }
  }

  if (!Array.isArray(globalBreakpoints) || !globalBreakpoints.length) {
    return pageExtra as typeof controls.extraDevices;
  }

  const devices = globalBreakpoints.map((bp) => {
    const width = mapWidth(bp);
    const type = toDeviceType(width);
    const id = `global-bp-${bp.id}`;
    return { id, label: bp.label, width, height: 800, type, orientation: "portrait" } as ReturnType<typeof usePageBuilderControls>["device"];
  });

  const deduped = new Map<string, typeof devices[number]>();
  [...pageExtra, ...devices].forEach((device) => {
    if (!deduped.has(device.id)) {
      deduped.set(device.id, device);
    }
  });

  return Array.from(deduped.values());
};

export function createToolbarProps({
  controls,
  selectedIds,
  state,
  dispatch,
  shop,
  progress,
  isValid,
  locales,
  pagesNav,
}: ToolbarOptions) {
  const breakpoints = resolveBreakpoints(state, selectedIds, shop);

  return buildToolbarProps({
    deviceId: controls.deviceId,
    setDeviceId: controls.setDeviceId,
    orientation: controls.orientation,
    setOrientation: controls.setOrientation,
    locale: controls.locale,
    setLocale: controls.setLocale,
    locales,
    progress,
    isValid,
    zoom: controls.zoom,
    setZoom: controls.setZoom,
    breakpoints,
    setBreakpoints: (list: Breakpoint[]) => {
      const sel = selectedIds[0];
      if (sel) {
        const flags = getSelectedFlags(state, selectedIds) as EditorFlagsWithGlobals | null;
        const isGlobal = !!flags?.global?.id;
        if (isGlobal) {
          dispatch({ type: "update-editor", id: sel, patch: { globalBreakpoints: list } as Partial<EditorFlagsWithGlobals> });
          try {
            const gid = String(flags?.global?.id || "");
            if (gid) void updateGlobal(shop, gid, { breakpoints: list });
          } catch {}
          return;
        }
      }
      dispatch({ type: "set-breakpoints", breakpoints: list });
    },
    extraDevices: resolveExtraDevices(controls, state, selectedIds, shop),
    editingSizePx: controls.editingSizePx ?? null,
    setEditingSizePx: controls.setEditingSizePx,
    pagesNav,
  });
}
