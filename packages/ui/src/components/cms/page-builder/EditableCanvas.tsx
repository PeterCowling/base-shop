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
import SelectionBreadcrumb from "./SelectionBreadcrumb";
import CommentsHelpLauncher from "./CommentsHelpLauncher";
import usePresence from "./collab/usePresence";
import useSelectionPositions from "./hooks/useSelectionPositions";
import PeerSelectionsOverlay from "./PeerSelectionsOverlay";
import SoftLockBanner from "./SoftLockBanner";
import useRulerProps from "./hooks/useRulerProps";
import useSelectionGrouping from "./hooks/useSelectionGrouping";
import useGroupingActions from "./hooks/useGroupingActions";
import useDimLockedSelection from "./hooks/useDimLockedSelection";
import useDropHighlight from "./hooks/useDropHighlight";
import { isHiddenForViewport } from "./state/layout/utils";
import CanvasItem from "./CanvasItem";
// i18n-exempt — builder-only surface; keep copy local
/* i18n-exempt */
const t = (s: string) => s;

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
  preferParentOnClick?: boolean;
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
  preferParentOnClick = false,
}: Props) {
  const [dropRect, setDropRectState] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  type PBWindow = Window & { __PB_USER_ID?: string; __PB_USER_NAME?: string };
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

  useDimLockedSelection({ enabled: (selectedIds?.length ?? 0) > 1 && selectedIds.length > 1 && unlockedIds.length >= 0, lockedIds });

  const { dropRect: dropRectLocal, handleDragOver, clearHighlight } = useDropHighlight({ preview: false, canvasRef, zoom, setDragOver });
  useEffect(() => { setDropRectState(dropRectLocal); }, [dropRectLocal]);

  const { setNodeRef: setCanvasDropRef, isOver: isCanvasOver } = useDroppable({ id: "canvas", data: {} });

  const assignCanvasRef = useCallback((node: HTMLDivElement | null) => {
    setCanvasDropRef(node);
    if (canvasRef) (canvasRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  }, [setCanvasDropRef, canvasRef]);

  const visibleComponents = components.filter((c) => !isHiddenForViewport(c.id, editor, (c as Partial<{ hidden?: boolean }>).hidden, viewport));
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

  const marquee = useMarqueeSelect({ canvasRef: canvasRef ?? { current: null }, zoom, editor, viewport, onSelectIds });
  const { contentWidth, contentAlign, contentAlignBase, contentAlignSource } = useRulerProps({ components, selectedIds, editor, viewport });

  // Listen for context-menu driven group/ungroup events
  useEffect(() => {
    const onGroup = (e: Event) => {
      try {
        const ce = e as CustomEvent<{ kind: "Section" | "MultiColumn" }>;
        const kind = ce?.detail?.kind;
        if (kind) groupAs(kind);
      } catch {}
    };
    const onUngroup = () => ungroup();
    window.addEventListener('pb:group', onGroup as EventListener);
    window.addEventListener('pb:ungroup', onUngroup as EventListener);
    return () => {
      window.removeEventListener('pb:group', onGroup as EventListener);
      window.removeEventListener('pb:ungroup', onUngroup as EventListener);
    };
  }, [groupAs, ungroup]);

  return (
    <SortableContext items={visibleComponents.map((c) => c.id)} strategy={rectSortingStrategy}>
      <div
        id="canvas"
        ref={assignCanvasRef}
        style={containerStyle}
        role="list"
        /* i18n-exempt */
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
          "relative mx-auto flex flex-col gap-4 rounded border", // i18n-exempt: class names
          (dragOver || isCanvasOver) && (
            dropAllowed === false
              ? "ring-2 ring-danger border-danger cursor-not-allowed" /* i18n-exempt: class names */
              : "ring-2 ring-primary" /* i18n-exempt: class names */
          )
        )}
      >
        {/* Bottom-left utilities: Breadcrumbs + Comments/Help */}
        <SelectionBreadcrumb components={components} selectedIds={selectedIds} onSelectIds={onSelectIds} />
        <CommentsHelpLauncher />
        {shop && pageId && showComments && (
          <CommentsLayer
            canvasRef={canvasRef ?? { current: null }}
            components={components}
            shop={shop ?? ""}
            pageId={pageId ?? ""}
            selectedIds={selectedIds}
            onSelectIds={onSelectIds}
          />
        )}
        {peers.length > 0 && <PeerSelectionsOverlay peers={peers} positions={positions} />}
        <SoftLockBanner selectedIds={selectedIds} softLocksById={softLocksById} />
        {dropRect && (
          // DS absolute-parent-guard: ensure positioned ancestor; avoid z-index per DS rules
          <div className="relative">
            <div className="pointer-events-none absolute rounded border-2 border-primary/50 bg-primary/10" style={{ left: dropRect.left, top: dropRect.top, width: dropRect.width, height: dropRect.height }} />
          </div>
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
                const action: import("./state/layout/types").ResizeAction = { type: "resize", id };
                if (p.left !== undefined) { action[leftKey] = p.left; action.left = p.left; }
                if (p.top !== undefined) { action[topKey] = p.top; action.top = p.top; }
                if (p.width !== undefined) { action[widthKey] = p.width; action.width = p.width; }
                if (p.height !== undefined) { action[heightKey] = p.height; action.height = p.height; }
                dispatch(action);
              });
            }}
          />
        )}
        {selectedIds.length > 1 && hasLockedInSelection && (
          // DS absolute-parent-guard: ensure positioned ancestor; avoid z-index per DS rules
          <div className="relative">
            <div className="pointer-events-none absolute start-2 top-2 rounded bg-muted/70 px-2 py-1 text-xs text-muted-foreground">{/* i18n-exempt */}{t("Locked items are ignored during group move/resize")}</div>
          </div>
        )}
        {showGrid && <GridOverlay gridCols={gridCols} baselineStep={showBaseline ? baselineStep : undefined} />}
        <SnapLine x={snapPosition} />
        {marquee.active && marquee.rect && (
          // DS absolute-parent-guard: ensure positioned ancestor; avoid z-index per DS rules
          <div className="relative">
            <div className="pointer-events-none absolute rounded border-2 border-primary/40 bg-primary/10" style={{ left: marquee.rect.left, top: marquee.rect.top, width: marquee.rect.width, height: marquee.rect.height }} aria-hidden />
          </div>
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
                try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: String(t("Block inserted")) })); } catch {}
              }}
            />
            {insertParentId === undefined && insertIndex === i && (
              <div
                data-placeholder
                className={cn(
                  "h-4 w-full rounded border-2 border-dashed transition-all duration-150 motion-reduce:transition-none", // i18n-exempt: class names
                  dropAllowed === false
                    ? "border-danger bg-danger/10 ring-2 ring-danger" /* i18n-exempt: class names */
                    : "border-primary bg-primary/10" /* i18n-exempt: class names */,
                  snapPosition !== null && (
                    dropAllowed === false
                      ? "ring-2 ring-danger" /* i18n-exempt: class names */
                      : "ring-2 ring-primary" /* i18n-exempt: class names */
                  )
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
              preferParentOnClick={preferParentOnClick}
            />
          </div>
        ))}
        <SelectionQuickActions
          components={components}
          selectedIds={selectedIds}
          dispatch={dispatch}
          canvasRef={canvasRef ?? ({ current: null } as React.RefObject<HTMLDivElement | null>)}
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
            try { window.dispatchEvent(new CustomEvent("pb-live-message", { detail: String(t("Block inserted")) })); } catch {}
          }}
        />
        {insertParentId === undefined && insertIndex === visibleComponents.length && (
          <div
            data-placeholder
            className={cn(
              "h-4 w-full rounded border-2 border-dashed transition-all duration-150 motion-reduce:transition-none", // i18n-exempt: class names
              dropAllowed === false
                ? "border-danger bg-danger/10 ring-2 ring-danger" /* i18n-exempt: class names */
                : "border-primary bg-primary/10" /* i18n-exempt: class names */,
              snapPosition !== null && (
                dropAllowed === false
                  ? "ring-2 ring-danger" /* i18n-exempt: class names */
                  : "ring-2 ring-primary" /* i18n-exempt: class names */
              )
            )}
          />
        )}
      </div>
    </SortableContext>
  );
}
