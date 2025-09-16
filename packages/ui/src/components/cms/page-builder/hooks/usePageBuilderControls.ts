"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Locale } from "@acme/i18n/locales";
import type { HistoryState } from "@acme/types";
import type { Action } from "../state";
import { devicePresets, getLegacyPreset, type DevicePreset } from "../../../../utils/devicePresets";
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

  const device = useMemo<DevicePreset>(() => {
    const preset =
      devicePresets.find((d: DevicePreset) => d.id === deviceId) ??
      devicePresets[0];
    return orientation === "portrait"
      ? { ...preset, orientation }
      : {
          ...preset,
          width: preset.height,
          height: preset.width,
          orientation,
        };
  }, [deviceId, orientation]);

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
    gridCols,
    setGridCols,
  };
};

export default usePageBuilderControls;

