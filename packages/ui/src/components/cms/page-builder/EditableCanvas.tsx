"use client";

import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { useCallback, useEffect, useState } from "react";
import type { PageComponent, HistoryState } from "@acme/types";
import type { Locale } from "@acme/i18n/locales";
import type { Action } from "./state";
import { cn } from "../../../utils/style";
import type { DevicePreset } from "../../../utils/devicePresets";
import GridOverlay from "./GridOverlay";
import SnapLine from "./SnapLine";
import RulersOverlay from "./RulersOverlay";
import MultiSelectOverlay from "./MultiSelectOverlay";
import useMarqueeSelect from "./useMarqueeSelect";
import InlineInsert from "./InlineInsert";
import CommentsLayer from "./CommentsLayer";
import SelectionQuickActions from "./SelectionQuickActions";
import usePresence from "./collab/usePresence";
import useSelectionPositions from "./hooks/useSelectionPositions";
import PeerSelectionsOverlay from "./PeerSelectionsOverlay";
import SoftLockBanner from "./SoftLockBanner";
import useRulerProps from "./hooks/useRulerProps";
import useSelectionGrouping from "./hooks/useSelectionGrouping";
import useDimLockedSelection from "./hooks/useDimLockedSelection";
import useDropHighlight from "./hooks/useDropHighlight";
import { isHiddenForViewport } from "./state/layout/utils";
import CanvasItem from "./CanvasItem";

interface Props {
  components: PageComponent[];
  selectedIds: string[];
  onSelectIds: (ids: string[]) => void;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onFileDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  insertIndex: number | null;
  insertParentId?: string | undefined;
  dispatch: (action: Action) => void;
  locale: Locale;
  containerStyle: React.CSSProperties;
  showGrid: boolean;
  gridCols: number;
  snapEnabled?: boolean;
  showRulers: boolean;
  viewport: "desktop" | "tablet" | "mobile";
  snapPosition: number | null;
  device?: DevicePreset;
  editor?: HistoryState["editor"];
  shop?: string | null;
  pageId?: string | null;
  showComments: boolean;
  zoom: number;
  showBaseline: boolean;
  baselineStep: number;
  dropAllowed?: boolean | null;
}

export default function EditableCanvas({
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
}: Props) {
  const [dropRect, setDropRectState] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  const { peers, softLocksById } = usePresence({
    shop: shop ?? null,
    pageId: pageId ?? null,
    meId: (typeof window !== "undefined" ? (window as any).__PB_USER_ID : null) || "me",
    label: (typeof window !== "undefined" ? (window as any).__PB_USER_NAME : null) || "Me",
    selectedIds,
    editingId: selectedIds[0] ?? null,
  });

  const positions = useSelectionPositions(canvasRef as any, components);
  const { unlockedIds, hasLockedInSelection, lockedIds } = useSelectionGrouping({ components, selectedIds, editor });

  useDimLockedSelection({ enabled: (selectedIds?.length ?? 0) > 1 && selectedIds.length > 1 && unlockedIds.length >= 0, lockedIds });

  const { dropRect: dropRectLocal, handleDragOver, clearHighlight } = useDropHighlight({ preview: false, canvasRef, zoom, setDragOver });
  useEffect(() => { setDropRectState(dropRectLocal); }, [dropRectLocal]);

  const { setNodeRef: setCanvasDropRef, isOver: isCanvasOver } = useDroppable({ id: "canvas", data: {} });

  const assignCanvasRef = useCallback((node: HTMLDivElement | null) => {
    setCanvasDropRef(node);
    if (canvasRef) (canvasRef as any).current = node;
  }, [setCanvasDropRef, canvasRef]);

  const visibleComponents = components.filter((c) => !isHiddenForViewport(c.id, editor, (c as any).hidden as boolean | undefined, viewport));
  const toUnderlyingIndex = (uiIndex: number): number => {
    if (uiIndex < visibleComponents.length) {
      const targetId = visibleComponents[uiIndex]?.id;
      if (targetId) {
        const idx = components.findIndex((c) => c.id === targetId);
        return idx >= 0 ? idx : components.length;
      }
    }
    return components.length;
  };

  const marquee = useMarqueeSelect({ canvasRef: canvasRef as any, zoom, editor, viewport, onSelectIds });
  const { contentWidth, contentAlign, contentAlignBase, contentAlignSource } = useRulerProps({ components, selectedIds, editor, viewport });

  return (
    <SortableContext items={visibleComponents.map((c) => c.id)} strategy={rectSortingStrategy}>
      <div
        id="canvas"
        ref={assignCanvasRef}
        style={containerStyle}
        role="list"
        aria-label="Canvas"
        onPointerDown={(e) => {
          const hasPointerEvent = typeof window !== "undefined" && typeof (window as any).PointerEvent !== "undefined";
          if (hasPointerEvent) {
            marquee.start(e as any, selectedIds, { shift: (e as any).shiftKey, meta: (e as any).metaKey || (e as any).ctrlKey });
          }
        }}
        onDrop={onFileDrop}
        onDragOver={handleDragOver}
        onDragLeave={clearHighlight}
        onDragEnd={clearHighlight}
        className={cn(
          "relative mx-auto flex flex-col gap-4 rounded border",
          (dragOver || isCanvasOver) && (dropAllowed === false ? "ring-2 ring-danger border-danger cursor-not-allowed" : "ring-2 ring-primary")
        )}
      >
        {shop && pageId && showComments && (
          <CommentsLayer canvasRef={canvasRef as any} components={components} shop={shop ?? ""} pageId={pageId ?? ""} selectedIds={selectedIds} />
        )}
        {peers.length > 0 && <PeerSelectionsOverlay peers={peers} positions={positions} />}
        <SoftLockBanner selectedIds={selectedIds} softLocksById={softLocksById} />
        {dropRect && (
          <div className="pointer-events-none absolute z-50 rounded border-2 border-primary/50 bg-primary/10" style={{ left: dropRect.left, top: dropRect.top, width: dropRect.width, height: dropRect.height }} />
        )}
        <RulersOverlay
          show={showRulers}
          canvasRef={canvasRef}
          step={100}
          viewport={viewport}
          contentWidth={contentWidth}
          contentAlign={contentAlign}
          contentAlignBase={contentAlignBase}
          contentAlignSource={contentAlignSource}
        />
        {selectedIds.length > 1 && unlockedIds.length > 0 && (
          <MultiSelectOverlay
            canvasRef={canvasRef}
            ids={unlockedIds}
            viewport={viewport}
            gridEnabled={snapEnabled ?? showGrid}
            gridCols={gridCols}
            zoom={zoom}
            onApply={(patches) => {
              const widthKey = viewport === "desktop" ? "widthDesktop" : viewport === "tablet" ? "widthTablet" : "widthMobile";
              const heightKey = viewport === "desktop" ? "heightDesktop" : viewport === "tablet" ? "heightTablet" : "heightMobile";
              const leftKey = viewport === "desktop" ? "leftDesktop" : viewport === "tablet" ? "leftTablet" : "leftMobile";
              const topKey = viewport === "desktop" ? "topDesktop" : viewport === "tablet" ? "topTablet" : "topMobile";
              const allowed = new Set(unlockedIds);
              Object.entries(patches).forEach(([id, p]) => {
                if (!allowed.has(id)) return;
                if (!p) return;
                const patch: Record<string, string | undefined> = {};
                if (p.left !== undefined) { patch[leftKey] = p.left; (patch as any).left = p.left; }
                if (p.top !== undefined) { patch[topKey] = p.top; (patch as any).top = p.top; }
                if (p.width !== undefined) { patch[widthKey] = p.width; (patch as any).width = p.width; }
                if (p.height !== undefined) { patch[heightKey] = p.height; (patch as any).height = p.height; }
                dispatch({ type: "resize", id, ...(patch as any) });
              });
            }}
          />
        )}
        {selectedIds.length > 1 && hasLockedInSelection && (
          <div className="pointer-events-none absolute left-2 top-2 z-40 rounded bg-muted/70 px-2 py-1 text-xs text-muted-foreground">Locked items are ignored during group move/resize</div>
        )}
        {showGrid && <GridOverlay gridCols={gridCols} baselineStep={showBaseline ? baselineStep : undefined} />}
        <SnapLine x={snapPosition} />
        {marquee.active && marquee.rect && (
          <div className="pointer-events-none absolute z-40 rounded border-2 border-primary/40 bg-primary/10" style={{ left: marquee.rect.left, top: marquee.rect.top, width: marquee.rect.width, height: marquee.rect.height }} aria-hidden />
        )}
        {visibleComponents.map((c, i) => (
          <div key={c.id} className="relative group">
            <InlineInsert
              index={i}
              context="top"
              onInsert={(component, index) => {
                const insertAt = toUnderlyingIndex(index);
                dispatch({ type: "add", component, index: insertAt });
                onSelectIds([component.id]);
                try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Block inserted" })); } catch {}
              }}
            />
            {insertParentId === undefined && insertIndex === i && (
              <div
                data-placeholder
                className={cn(
                  "h-4 w-full rounded border-2 border-dashed transition-all duration-150 motion-reduce:transition-none",
                  dropAllowed === false ? "border-danger bg-danger/10 ring-2 ring-danger" : "border-primary bg-primary/10",
                  snapPosition !== null && (dropAllowed === false ? "ring-2 ring-danger" : "ring-2 ring-primary")
                )}
              />
            )}
            <CanvasItem
              component={c}
              index={i}
              parentId={undefined}
              selectedIds={selectedIds}
              onSelect={(id, e) => {
                if (e?.metaKey || e?.ctrlKey || e?.shiftKey) {
                  const exists = selectedIds.includes(id);
                  onSelectIds(exists ? selectedIds.filter((sid) => sid !== id) : [...selectedIds, id]);
                } else {
                  onSelectIds([id]);
                }
                setTimeout(() => { (document.querySelector(`[data-component-id="${id}"]`) as HTMLElement | null)?.focus?.(); }, 0);
              }}
              onRemove={() => dispatch({ type: "remove", id: c.id })}
              dispatch={dispatch}
              locale={locale}
              gridEnabled={snapEnabled ?? showGrid}
              gridCols={gridCols}
              viewport={viewport}
              device={device}
              editor={editor}
              zoom={zoom}
              baselineSnap={showBaseline}
              baselineStep={baselineStep}
              dropAllowed={dropAllowed}
              insertParentId={insertParentId}
              insertIndex={insertIndex}
            />
          </div>
        ))}
        <SelectionQuickActions
          components={components}
          selectedIds={selectedIds}
          dispatch={dispatch}
          canvasRef={(canvasRef as any) ?? ({ current: null } as React.RefObject<HTMLDivElement | null>)}
          viewport={viewport}
          disabled={hasLockedInSelection}
          zoom={zoom}
        />
        <InlineInsert
          index={visibleComponents.length}
          context="top"
          onInsert={(component, index) => {
            const insertAt = toUnderlyingIndex(index);
            dispatch({ type: "add", component, index: insertAt });
            onSelectIds([component.id]);
            try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: "Block inserted" })); } catch {}
          }}
        />
        {insertParentId === undefined && insertIndex === visibleComponents.length && (
          <div
            data-placeholder
            className={cn(
              "h-4 w-full rounded border-2 border-dashed transition-all duration-150 motion-reduce:transition-none",
              dropAllowed === false ? "border-danger bg-danger/10 ring-2 ring-danger" : "border-primary bg-primary/10",
              snapPosition !== null && (dropAllowed === false ? "ring-2 ring-danger" : "ring-2 ring-primary")
            )}
          />
        )}
      </div>
    </SortableContext>
  );
}
