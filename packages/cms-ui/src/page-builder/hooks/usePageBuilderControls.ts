"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useTranslations } from "@acme/i18n";
import type { HistoryState } from "@acme/types";
import type { Locale as PageBuilderLocale } from "@acme/types/constants";
import { usePreviewDevice } from "@acme/ui/hooks";
import { type DevicePreset, devicePresets, findDevicePresetById,getLegacyPreset } from "@acme/ui/utils/devicePresets";

import { type CallBackProps, STATUS,type Step } from "../PageBuilderTour";
import type { Action } from "../state";

import useViewport from "./useViewport";

export interface PageBuilderControlsParams {
  state: HistoryState;
  dispatch: React.Dispatch<Action>;
}

const VIEWPORT_KEYS = ["desktop", "tablet", "mobile"] as const;
type ViewportKey = (typeof VIEWPORT_KEYS)[number];
type EditingSizeState = Record<ViewportKey, number | null>;

const makeEmptyEditingSize = (): EditingSizeState => ({
  desktop: null,
  tablet: null,
  mobile: null,
});

const clampEditingWidth = (value: number): number =>
  Math.max(320, Math.min(1920, Math.round(value)));

const normalizeEditingSizeValue = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return clampEditingWidth(value);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number.parseFloat(trimmed);
    if (!Number.isFinite(parsed)) return null;
    return clampEditingWidth(parsed);
  }
  return null;
};

const editingSizeFromMeta = (value: unknown): EditingSizeState => {
  const next = makeEmptyEditingSize();
  if (!value || typeof value !== "object") {
    return next;
  }
  const source = value as Record<string, unknown>;
  VIEWPORT_KEYS.forEach((key) => {
    const normalized = normalizeEditingSizeValue(source[key]);
    if (normalized !== null) {
      next[key] = normalized;
    }
  });
  return next;
};

const toStoredEditingSize = (
  state: EditingSizeState,
): Partial<Record<ViewportKey, number>> => {
  const stored: Partial<Record<ViewportKey, number>> = {};
  VIEWPORT_KEYS.forEach((key) => {
    const value = state[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      stored[key] = value;
    }
  });
  return stored;
};

type Breakpoint = { id: string; label: string; min?: number; max?: number };

const coerceBreakpoints = (value: unknown): Breakpoint[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((bp): bp is Breakpoint =>
    bp && typeof bp === "object" && typeof (bp as Breakpoint).id === "string" && typeof (bp as Breakpoint).label === "string"
  );
};

const usePageBuilderControls = ({ state, dispatch }: PageBuilderControlsParams) => {
  const [deviceId, setDeviceId] = usePreviewDevice(devicePresets[0].id);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );

  // Custom breakpoints (stored in HistoryState via layout.schema passthrough)
  const breakpoints = useMemo(
    () => coerceBreakpoints((state as Record<string, unknown>).breakpoints),
    [state]
  );
  const extraDevices = useMemo<DevicePreset[]>(() => {
    const mapWidth = (bp: Breakpoint): number => {
      const base = (typeof bp.max === 'number' && bp.max > 0) ? bp.max : (typeof bp.min === 'number' ? bp.min : 1024);
      return Math.max(320, Math.min(1920, base));
    };
    const toType = (w: number): DevicePreset["type"] => (w >= 1024 ? "desktop" : w >= 768 ? "tablet" : "mobile");
    return breakpoints.map((bp) => {
      const width = mapWidth(bp);
      const type = toType(width);
      const id = `bp-${bp.id}`;
      return { id, label: bp.label, width, height: 800, type, orientation: "portrait" } as DevicePreset;
    });
  }, [breakpoints]);
  const device = useMemo<DevicePreset>(() => {
    const all = [...extraDevices, ...devicePresets];
    const preset =
      all.find((d: DevicePreset) => d.id === deviceId) ??
      findDevicePresetById(deviceId) ??
      devicePresets.find((d: DevicePreset) => d.id === deviceId) ??
      (all[0] || devicePresets[0]);
    return orientation === "portrait"
      ? { ...preset, orientation }
      : { ...preset, width: preset.height, height: preset.width, orientation };
  }, [deviceId, orientation, extraDevices]);

  const viewport: "desktop" | "tablet" | "mobile" = device.type;
  const { viewportStyle, frameClass } = useViewport(device);
  const [pageEditingSize, setPageEditingSize] = useState<EditingSizeState>(() => makeEmptyEditingSize());
  const pinnedGlobal = useMemo(() => {
    const editorMap = state.editor ?? {};
    for (const [id, flags] of Object.entries(editorMap as Record<string, import("../state/layout/types").EditorFlags>)) {
      const globalMeta = flags?.global;
      if (globalMeta?.pinned) {
        return { id, meta: globalMeta as Record<string, unknown> };
      }
    }
    return null;
  }, [state.editor]);
  const pinnedEditingSize = useMemo<EditingSizeState | null>(() => {
    if (!pinnedGlobal?.meta) return null;
    return editingSizeFromMeta((pinnedGlobal.meta as Record<string, unknown>).editingSize);
  }, [pinnedGlobal]);
  const editingSizeRecord = pinnedEditingSize ?? pageEditingSize;
  const setEditingSizePx = useCallback(
    (value: number | null) => {
      const normalized = normalizeEditingSizeValue(value);
      if (pinnedGlobal?.id && pinnedEditingSize) {
        if (pinnedEditingSize[viewport] === normalized) {
          return;
        }
        const nextRecord: EditingSizeState = { ...pinnedEditingSize, [viewport]: normalized };
        const stored = toStoredEditingSize(nextRecord);
        const nextGlobal: NonNullable<import("../state/layout/types").EditorFlags["global"]> = { id: pinnedGlobal.id };
        Object.assign(nextGlobal, (pinnedGlobal.meta ?? {}) as Record<string, unknown>);
        if (Object.keys(stored).length === 0) {
          delete nextGlobal.editingSize;
        } else {
          nextGlobal.editingSize = stored;
        }
        dispatch({ type: "update-editor", id: pinnedGlobal.id, patch: { global: nextGlobal } });
        return;
      }
      setPageEditingSize((prev) => {
        if (prev[viewport] === normalized) return prev;
        return { ...prev, [viewport]: normalized };
      });
    },
    [dispatch, pinnedGlobal, pinnedEditingSize, viewport],
  );
  const effectiveViewportStyle = useMemo(() => {
    const px = editingSizeRecord[viewport];
    if (typeof px === "number" && Number.isFinite(px)) {
      return { ...viewportStyle, width: `${px}px` } as typeof viewportStyle;
    }
    return viewportStyle;
  }, [viewportStyle, editingSizeRecord, viewport]);

  const [locale, setLocale] = useState<PageBuilderLocale>("en");
  const [showPreview, setShowPreview] = useState(false);
  const togglePreview = useCallback(
    () => setShowPreview((p) => !p),
    []
  );
  const rotateDevice = useCallback(
    () =>
      setOrientation((o) => (o === "portrait" ? "landscape" : "portrait")),
    []
  );

  const [previewDeviceId, setPreviewDeviceId] = useState(
    getLegacyPreset("desktop").id
  );

  const [runTour, setRunTour] = useState(false);
  const t = useTranslations();
  const tourSteps = useMemo<Step[]>(
    () => [
      {
        target: "[data-tour='palette']", // i18n-exempt -- PB-0002 CSS selector, not user-facing [ttl=2026-01-01]
        content: t("pb.tour.palette"),
      },
      {
        target: "[data-tour='toolbar']", // i18n-exempt -- PB-0002 CSS selector, not user-facing [ttl=2026-01-01]
        content: t("pb.tour.toolbar"),
      },
      {
        target: "[data-tour='canvas']", // i18n-exempt -- PB-0002 CSS selector, not user-facing [ttl=2026-01-01]
        content: t("pb.tour.canvas"),
      },
      {
        target: "[data-tour='sidebar']", // i18n-exempt -- PB-0002 CSS selector, not user-facing [ttl=2026-01-01]
        content: t("pb.tour.sidebar"),
      },
    ],
    [t]
  );
  const handleTourCallback = useCallback((data: CallBackProps) => {
    if (data.status === STATUS.FINISHED || data.status === STATUS.SKIPPED) {
      setRunTour(false);
      if (typeof window !== "undefined") {
        localStorage.setItem("page-builder-tour", "done");
      }
    }
  }, []);

  useEffect(() => {
    // Do not auto-run the tour during tests to avoid interfering with DOM queries
    const isTest = typeof process !== "undefined" && process.env.NODE_ENV === "test";
    if (
      !isTest &&
      typeof window !== "undefined" &&
      !localStorage.getItem("page-builder-tour")
    ) {
      setRunTour(true);
    }
  }, []);

  const startTour = useCallback(() => setRunTour(true), []);

  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const toggleSnap = useCallback(() => setSnapToGrid((s) => !s), []);
  const gridCols =
    typeof state.gridCols === "number" ? state.gridCols : 12;
  const toggleGrid = useCallback(() => {
    setShowGrid((g) => !g);
    dispatch({ type: "set-grid-cols", gridCols });
  }, [dispatch, gridCols]);

  const setGridCols = useCallback(
    (n: number) => dispatch({ type: "set-grid-cols", gridCols: n }),
    [dispatch]
  );

  // Canvas zoom (independent of device scaling)
  const [zoom, setZoom] = useState(1);
  // Rulers toggle
  const [showRulers, setShowRulers] = useState(false);
  const toggleRulers = useCallback(() => setShowRulers((s) => !s), []);
  // Baseline grid overlay
  const [showBaseline, setShowBaseline] = useState(false);
  const [baselineStep, setBaselineStep] = useState(8);
  const toggleBaseline = useCallback(() => setShowBaseline((s) => !s), []);

  const setBreakpoints = useCallback(
    (list: Breakpoint[]) => dispatch({ type: "set-breakpoints", breakpoints: list }),
    [dispatch]
  );

  // Cross-breakpoint notifications (show indicators for overrides)
  const [crossBreakpointNotices, setCrossBreakpointNotices] = useState(true);

  return {
    deviceId,
    setDeviceId,
    orientation,
    setOrientation,
    rotateDevice,
    device,
    viewport,
    viewportStyle: effectiveViewportStyle,
    frameClass,
    locale,
    setLocale,
    showPreview,
    togglePreview,
    previewDeviceId,
    setPreviewDeviceId,
    runTour,
    startTour,
    tourSteps,
    handleTourCallback,
    showGrid,
    toggleGrid,
    snapToGrid,
    toggleSnap,
    gridCols,
    setGridCols,
    showRulers,
    toggleRulers,
    showBaseline,
    toggleBaseline,
    baselineStep,
    setBaselineStep,
    zoom,
    setZoom,
    breakpoints,
    setBreakpoints,
    extraDevices,
    editingSizePx: editingSizeRecord[viewport] ?? null,
    setEditingSizePx,
    crossBreakpointNotices,
    setCrossBreakpointNotices,
  };
};

export default usePageBuilderControls;
