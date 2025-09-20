"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Locale } from "@acme/i18n/locales";
import type { HistoryState } from "@acme/types";
import type { Action } from "../state";
import { devicePresets, getLegacyPreset, type DevicePreset, findDevicePresetById } from "../../../../utils/devicePresets";
import { usePreviewDevice } from "../../../../hooks";
import useViewport from "./useViewport";
import { Step, CallBackProps, STATUS } from "../PageBuilderTour";

interface Params {
  state: HistoryState;
  dispatch: React.Dispatch<Action>;
}

const usePageBuilderControls = ({ state, dispatch }: Params) => {
  const [deviceId, setDeviceId] = usePreviewDevice(devicePresets[0].id);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );

  // Custom breakpoints (stored in HistoryState via layout.schema passthrough)
  const breakpoints = (state as any).breakpoints ?? [] as { id: string; label: string; min?: number; max?: number }[];
  const extraDevices = useMemo<DevicePreset[]>(() => {
    const mapWidth = (bp: any): number => {
      const base = (typeof bp.max === 'number' && bp.max > 0) ? bp.max : (typeof bp.min === 'number' ? bp.min : 1024);
      return Math.max(320, Math.min(1920, base));
    };
    const toType = (w: number): DevicePreset["type"] => (w >= 1024 ? "desktop" : w >= 768 ? "tablet" : "mobile");
    return (breakpoints as any[]).map((bp) => {
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

  const [locale, setLocale] = useState<Locale>("en");
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
  const tourSteps = useMemo<Step[]>(
    () => [
      {
        target: "[data-tour='palette']",
        content: "Drag components from the palette onto the canvas.",
      },
      {
        target: "[data-tour='toolbar']",
        content: "Use the toolbar to change device, locale, and more.",
      },
      {
        target: "[data-tour='canvas']",
        content: "Arrange and edit components on the canvas.",
      },
      {
        target: "[data-tour='sidebar']",
        content: "Edit the selected component's settings in this sidebar.",
      },
    ],
    []
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
    if (
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

  const setBreakpoints = useCallback((list: any[]) => dispatch({ type: "set-breakpoints", breakpoints: list } as any), [dispatch]);

  return {
    deviceId,
    setDeviceId,
    orientation,
    setOrientation,
    rotateDevice,
    device,
    viewport,
    viewportStyle,
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
  };
};

export default usePageBuilderControls;
