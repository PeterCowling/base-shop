import { buildToolbarProps } from "./buildProps";
import { listGlobals, updateGlobal, type GlobalItem } from "./libraryStore";
import type { PageBuilderProps } from "./PageBuilder.types";
import type { HistoryState } from "@acme/types";
import type { Dispatch } from "react";
import type usePageBuilderControls from "./hooks/usePageBuilderControls";
import type { Action } from "./state";
import type { UploadProgress } from "../../../hooks/useFileUpload";

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

const mapWidth = (bp: any): number => {
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
  const editor = (state as any).editor ?? {};
  return editor[sel] ?? null;
};

const resolveBreakpoints = (
  state: HistoryState,
  selectedIds: string[],
  shop?: string | null,
): any[] => {
  const flags = getSelectedFlags(state, selectedIds);
  const isGlobal = !!flags?.global?.id;
  if (!isGlobal) return ((state as any).breakpoints ?? []) as any[];

  if (Array.isArray(flags.globalBreakpoints)) {
    return flags.globalBreakpoints as any[];
  }

  const gid = String(flags.global?.id || "");
  if (!gid) return [];

  try {
    const globalItems = listGlobals(shop);
    const found = globalItems.find((g) => g.globalId === gid) as GlobalItem | undefined;
    return (found?.breakpoints ?? []) as any[];
  } catch {
    return [];
  }
};

const resolveExtraDevices = (
  controls: ReturnType<typeof usePageBuilderControls>,
  state: HistoryState,
  selectedIds: string[],
  shop?: string | null,
): any[] => {
  const pageExtra = controls.extraDevices || [];
  const flags = getSelectedFlags(state, selectedIds);
  const isGlobal = !!flags?.global?.id;
  let globalBreakpoints = isGlobal ? ((flags as any)?.globalBreakpoints ?? []) : [];

  if (isGlobal && (!globalBreakpoints || globalBreakpoints.length === 0)) {
    try {
      const gid = String(flags?.global?.id || "");
      const found = listGlobals(shop).find((i) => i.globalId === gid) as GlobalItem | undefined;
      globalBreakpoints = (found?.breakpoints ?? []) as any[];
    } catch {
      globalBreakpoints = [];
    }
  }

  if (!Array.isArray(globalBreakpoints) || !globalBreakpoints.length) {
    return pageExtra as any[];
  }

  const devices = globalBreakpoints.map((bp: any) => {
    const width = mapWidth(bp);
    const type = toDeviceType(width);
    const id = `global-bp-${bp.id}`;
    return { id, label: bp.label, width, height: 800, type, orientation: "portrait" } as any;
  });

  const deduped = new Map<string, any>();
  [...pageExtra, ...devices].forEach((device: any) => {
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
    setBreakpoints: (list: any[]) => {
      const sel = selectedIds[0];
      if (sel) {
        const flags = getSelectedFlags(state, selectedIds);
        const isGlobal = !!flags?.global?.id;
        if (isGlobal) {
          dispatch({ type: "update-editor", id: sel, patch: { globalBreakpoints: list } as any });
          try {
            const gid = String(flags?.global?.id || "");
            if (gid) void updateGlobal(shop, gid, { breakpoints: list as any });
          } catch {}
          return;
        }
      }
      dispatch({ type: "set-breakpoints", breakpoints: list } as any);
    },
    extraDevices: resolveExtraDevices(controls, state, selectedIds, shop),
    editingSizePx: (controls as any).editingSizePx ?? null,
    setEditingSizePx: (controls as any).setEditingSizePx,
    pagesNav,
  });
}
