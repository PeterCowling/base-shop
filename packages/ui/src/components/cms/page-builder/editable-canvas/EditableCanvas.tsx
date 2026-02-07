"use client";

import { useMemo } from "react";
import { rectSortingStrategy,SortableContext } from "@dnd-kit/sortable";

import { cn } from "../../../../utils/style";
import usePresence from "../collab/usePresence";
import useDimLockedSelection from "../hooks/useDimLockedSelection";
import useGroupingActions from "../hooks/useGroupingActions";
import useRulerProps from "../hooks/useRulerProps";
import useSelectionGrouping from "../hooks/useSelectionGrouping";
import useSelectionPositions from "../hooks/useSelectionPositions";
import SelectionQuickActions from "../SelectionQuickActions";
import useMarqueeSelect from "../useMarqueeSelect";

import CanvasList from "./CanvasList";
import Overlays from "./Overlays";
import type { PBWindow, Props } from "./types";
import { t } from "./types";
import { useCanvasRefs } from "./useCanvasRefs";
import { useDropHighlightState } from "./useDropHighlightState";
import { useGroupEvents } from "./useGroupEvents";
import { useVisibleComponents } from "./useVisibleComponents";

export default function EditableCanvas(props: Props) {
  const {
    components,
    selectedIds,
    onSelectIds,
    canvasRef,
    dragOver,
    setDragOver,
    onFileDrop,
    insertIndex,
    insertParentId,
    dispatch,
    locale,
    containerStyle,
    showGrid,
    gridCols,
    snapEnabled,
    showRulers,
    viewport,
    snapPosition,
    device,
    editor,
    shop,
    pageId,
    showComments,
    zoom,
    showBaseline,
    baselineStep,
    dropAllowed,
    preferParentOnClick = false,
  } = props;

  const w: PBWindow | undefined = typeof window !== "undefined" ? (window as PBWindow) : undefined;

  const { peers, softLocksById } = usePresence({
    shop: shop ?? null,
    pageId: pageId ?? null,
    // i18n-exempt: developer identifiers when session missing
    meId: (w?.__PB_USER_ID ?? null) || "me",
    // i18n-exempt: developer label when session missing
    label: (w?.__PB_USER_NAME ?? null) || "Me",
    selectedIds,
    editingId: selectedIds[0] ?? null,
  });

  const positions = useSelectionPositions(canvasRef, components);
  const { unlockedIds, hasLockedInSelection, lockedIds } = useSelectionGrouping({ components, selectedIds, editor });
  const { groupAs, ungroup } = useGroupingActions({ components, selectedIds, dispatch });
  useGroupEvents(groupAs, ungroup);

  useDimLockedSelection({ enabled: (selectedIds?.length ?? 0) > 1 && selectedIds.length > 1 && unlockedIds.length >= 0, lockedIds });

  const marquee = useMarqueeSelect({ canvasRef: canvasRef ?? { current: null }, zoom, editor, viewport, onSelectIds });
  const ruler = useRulerProps({ components, selectedIds, editor, viewport });

  const { dropRect, handleDragOver, clearHighlight } = useDropHighlightState({ preview: false, canvasRef, zoom, setDragOver });
  const { assignCanvasRef, isCanvasOver } = useCanvasRefs(canvasRef);

  const { visibleComponents, toUnderlyingIndex } = useVisibleComponents(components, editor, viewport);

  const onMultiSelectApply = useMemo(() => (
    (patches: Record<string, Partial<{ left: string; top: string; width: string; height: string }>>) => {
      const widthKey = viewport === "desktop" ? "widthDesktop" : viewport === "tablet" ? "widthTablet" : "widthMobile";
      const heightKey = viewport === "desktop" ? "heightDesktop" : viewport === "tablet" ? "heightTablet" : "heightMobile";
      const leftKey = viewport === "desktop" ? "leftDesktop" : viewport === "tablet" ? "leftTablet" : "leftMobile";
      const topKey = viewport === "desktop" ? "topDesktop" : viewport === "tablet" ? "topTablet" : "topMobile";
      const allowed = new Set(unlockedIds);
      Object.entries(patches).forEach(([id, p]) => {
        if (!allowed.has(id)) return;
        if (!p) return;
        const action: import("../state/layout/types").ResizeAction = { type: "resize", id };
        if (p.left !== undefined) { (action as any)[leftKey] = p.left; (action as any).left = p.left; }
        if (p.top !== undefined) { (action as any)[topKey] = p.top; (action as any).top = p.top; }
        if (p.width !== undefined) { (action as any)[widthKey] = p.width; (action as any).width = p.width; }
        if (p.height !== undefined) { (action as any)[heightKey] = p.height; (action as any).height = p.height; }
        dispatch(action);
      });
    }
  ), [viewport, unlockedIds, dispatch]);

  return (
    <SortableContext items={visibleComponents.map((c) => c.id)} strategy={rectSortingStrategy}>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- PB-2419: Canvas root needs pointer/drag listeners for marquee and DnD; not keyboard-activatable */}
      <div
        id="canvas"
        ref={assignCanvasRef}
        // eslint-disable-next-line react/forbid-dom-props -- PB-2419: containerStyle is dynamic (sizing/position) and confined to editor canvas
        style={containerStyle}
        role="list"
        aria-label={t("Canvas")}
        data-cy="pb-canvas"
        onPointerDown={(e) => {
          const hasPointerEvent = typeof window !== "undefined" && "PointerEvent" in window;
          if (hasPointerEvent) {
            marquee.start(e, selectedIds, { shift: e.shiftKey, meta: e.metaKey || e.ctrlKey });
          }
        }}
        onDrop={onFileDrop}
        onDragOver={handleDragOver}
        onDragLeave={clearHighlight}
        onDragEnd={clearHighlight}
        className={cn(
          // i18n-exempt: CSS utility classes
          "relative mx-auto flex flex-col gap-4 rounded border", // i18n-exempt -- PB-2419 utility class names
          (dragOver || isCanvasOver) && (
            (dropAllowed === false)
              // i18n-exempt: CSS utility classes
              ? "ring-2 ring-danger border-danger cursor-not-allowed" // i18n-exempt -- PB-2419 utility class names
              // i18n-exempt: CSS utility classes
              : "ring-2 ring-primary" // i18n-exempt -- PB-2419 utility class names
          )
        )}
      >
        <Overlays
          components={components}
          selectedIds={selectedIds}
          onSelectIds={onSelectIds}
          canvasRef={canvasRef}
          shop={shop}
          pageId={pageId}
          showComments={showComments}
          peers={peers}
          positions={positions}
          softLocksById={softLocksById}
          dropRect={dropRect}
          showRulers={showRulers}
          viewport={viewport}
          ruler={ruler}
          unlockedIds={unlockedIds}
          hasLockedInSelection={hasLockedInSelection}
          gridCols={gridCols}
          showGrid={showGrid}
          snapEnabled={snapEnabled}
          zoom={zoom}
          snapPosition={snapPosition}
          marquee={{ active: marquee.active, rect: marquee.rect }}
          showBaseline={showBaseline}
          baselineStep={baselineStep}
          onMultiSelectApply={onMultiSelectApply}
        />

        <CanvasList
          components={components}
          visibleComponents={visibleComponents}
          toUnderlyingIndex={toUnderlyingIndex}
          selectedIds={selectedIds}
          onSelectIds={onSelectIds}
          dispatch={dispatch}
          locale={locale}
          snapEnabled={snapEnabled}
          showGrid={showGrid}
          gridCols={gridCols}
          viewport={viewport}
          device={device}
          editor={editor}
          zoom={zoom}
          showBaseline={showBaseline}
          baselineStep={baselineStep}
          dropAllowed={dropAllowed}
          insertParentId={insertParentId}
          insertIndex={insertIndex}
          snapPosition={snapPosition}
          preferParentOnClick={preferParentOnClick}
        />

        <SelectionQuickActions
          components={components}
          selectedIds={selectedIds}
          dispatch={dispatch}
          canvasRef={canvasRef ?? ({ current: null } as React.RefObject<HTMLDivElement | null>)}
          viewport={viewport}
          disabled={hasLockedInSelection}
          zoom={zoom}
        />
      </div>
    </SortableContext>
  );
}
