"use client";

import { useEffect, useRef, useState } from "react";
import type { ProductHotspotConfig } from "@acme/product-configurator";
import { useModeStore } from "../state/modeStore";
import type { VisibleHotspot } from "./useHotspotVisibility";
import { useCameraFocusStore } from "../state/cameraStore";

type HotspotOverlayProps = {
  hotspots: VisibleHotspot[];
  hotspotConfig?: ProductHotspotConfig | null;
  onPersistOffsets?: (offsets: Record<string, { x: number; y: number }>) => void;
};

function HotspotGlyph({ active }: { active: boolean }) {
  return (
    <span
      className={`relative flex h-7 w-7 items-center justify-center rounded-full border shadow-elevation-2 transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-primary/60 bg-panel text-primary hover:border-primary"
      }`}
    >
      <span className="relative flex h-4 w-4 items-center justify-center">
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L10.5 4.6" />
          <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 0 0 7.07 7.07l2.33-2.33" />
        </svg>
      </span>
    </span>
  );
}

export function HotspotOverlay({
  hotspots,
  hotspotConfig,
  onPersistOffsets,
}: HotspotOverlayProps) {
  const focusOn = useCameraFocusStore((state) => state.setFocusPoint);
  const bagOpen = useModeStore((state) => state.bagOpen);
  const setBagOpen = useModeStore((state) => state.setBagOpen);
  const closePanel = useModeStore((state) => state.closePanel);
  const clearActiveRegion = useModeStore((state) => state.clearActiveRegion);
  const activeRegionId = useModeStore((state) => state.activeRegionId);
  const activeHotspotId = useModeStore((state) => state.activeHotspotId);
  const openPanelForHotspot = useModeStore((state) => state.openPanelForHotspot);
  const configMode = useModeStore((state) => state.hotspotConfigMode);
  const setConfigMode = useModeStore((state) => state.setHotspotConfigMode);

  const [offsets, setOffsets] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const offsetsRef = useRef(offsets);
  const [dragging, setDragging] = useState<{
    hotspotId: string;
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
  } | null>(null);

  useEffect(() => {
    if (!hotspotConfig?.hotspots?.length) return;
    const nextOffsets: Record<string, { x: number; y: number }> = {};
    for (const hotspot of hotspotConfig.hotspots) {
      if (hotspot.offset) {
        nextOffsets[hotspot.id] = hotspot.offset;
      }
    }
    offsetsRef.current = nextOffsets;
    setOffsets(nextOffsets);
  }, [hotspotConfig]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.has("hotspotConfig")) {
      setConfigMode(true);
    }
  }, [setConfigMode]);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (event: PointerEvent) => {
      setOffsets((prev) => {
        const next = {
          ...prev,
          [dragging.hotspotId]: {
            x: dragging.baseX + (event.clientX - dragging.startX),
            y: dragging.baseY + (event.clientY - dragging.startY),
          },
        };
        offsetsRef.current = next;
        return next;
      });
    };
    const handleUp = () => {
      if (dragging) {
        setDragging(null);
        if (configMode) {
          onPersistOffsets?.(offsetsRef.current);
        }
      }
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [configMode, dragging, onPersistOffsets]);

  if (hotspots.length === 0) return null;

  return (
    <>
      {hotspots.map((hotspot) => {
        const isActive = activeHotspotId
          ? activeHotspotId === hotspot.hotspotId
          : activeRegionId === hotspot.regionId;
        const offset = offsets[hotspot.hotspotId] ?? { x: 0, y: 0 };
        return (
          <button
            key={hotspot.hotspotId}
            type="button"
            className="group pointer-events-auto absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-150 ease-out active:scale-[0.98]"
            style={{
              left: hotspot.screenX + offset.x,
              top: hotspot.screenY + offset.y,
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
              if (configMode) {
                event.preventDefault();
                const base = offsets[hotspot.hotspotId] ?? { x: 0, y: 0 };
                setDragging({
                  hotspotId: hotspot.hotspotId,
                  startX: event.clientX,
                  startY: event.clientY,
                  baseX: base.x,
                  baseY: base.y,
                });
              }
            }}
            onClick={(event) => {
              event.stopPropagation();
              if (configMode) return;
              focusOn(hotspot.focusPoint, hotspot.distanceToCamera * 0.75);
              if (hotspot.hotspotId === "hs_flap") {
                closePanel();
                clearActiveRegion();
                setBagOpen(!bagOpen);
                return;
              }
              openPanelForHotspot(hotspot.hotspotId, hotspot.regionId);
            }}
            aria-label={`Customize ${hotspot.label}`}
          >
            <HotspotGlyph active={isActive} />
          </button>
        );
      })}

      {configMode ? (
        <div className="pointer-events-auto fixed bottom-24 left-6 z-40 max-w-xs rounded-lg border border-border-1 bg-panel/95 p-3 text-[11px] text-muted-foreground shadow-elevation-2">
          <div className="flex items-center justify-between gap-2 text-[10px] uppercase tracking-[0.3em] text-foreground">
            Hotspot config
            <button
              type="button"
              className="text-[10px] uppercase tracking-[0.3em] text-primary"
              onClick={() => setConfigMode(false)}
            >
              Done
            </button>
          </div>
          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-[10px] text-muted-foreground">
            {JSON.stringify(offsets, null, 2)}
          </pre>
        </div>
      ) : null}
    </>
  );
}
