"use client";
import { DragEndEvent, DragMoveEvent, DragStartEvent, closestCenter } from "@dnd-kit/core";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PageComponent, HistoryState } from "@acme/types";
import type { Action } from "../state";
import { snapToGrid } from "../gridSnap";
import type { ComponentType } from "../defaults";
import { canDropChild } from "../rules";
import { screenToCanvas } from "../utils/coords";
import type { Point } from "../utils/coords";
import { useDndSensors } from "./dnd/sensors";
import { autoScroll, AUTOSCROLL_EDGE_PX, AUTOSCROLL_MAX_SPEED_PX } from "./dnd/autoscroll";
import { isPointerEvent, safeDispatchEvent } from "./dnd/dom";
import { findById, findParentId, getTypeOfId, getVisibleComponents, resolveParentKind } from "./dnd/tree";
import { useIframeShields } from "./dnd/iframeShields";
import { useLastTabHover } from "./dnd/tabHover";
import { finalizeDrop } from "./dnd/finalizeDrop";

const noop = () => {};

interface Params {
  components: PageComponent[];
  dispatch: (action: Action) => void;
  defaults: Record<string, Partial<PageComponent>>;
  containerTypes: ComponentType[];
  selectId: (id: string) => void;
  gridSize?: number;
  canvasRef?: React.RefObject<HTMLDivElement | null>;
  setSnapPosition?: (x: number | null) => void;
  editor?: HistoryState["editor"];
  viewport?: "desktop" | "tablet" | "mobile";
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  zoom?: number;
  t?: (key: string, vars?: Record<string, unknown>) => string;
}

export function usePageBuilderDnD({
  components,
  dispatch,
  defaults,
  containerTypes,
  selectId,
  gridSize = 1,
  canvasRef,
  setSnapPosition = noop,
  editor,
  viewport,
  scrollRef,
  zoom = 1,
  t,
}: Params) {
  type DragFrom = "palette" | "library" | "canvas";
  // DnD sensors from single-purpose module
  const sensors = useDndSensors();

  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [insertParentId, setInsertParentId] = useState<string | undefined>(undefined);
  const [activeType, setActiveType] = useState<ComponentType | null>(null);
  const [dragMeta, setDragMeta] = useState<{ from: DragFrom; type?: ComponentType; count?: number; id?: string; label?: string; thumbnail?: string | null } | null>(null);
  const [currentOverId, setCurrentOverId] = useState<string | null>(null);
  const [dropAllowed, setDropAllowed] = useState<boolean | null>(null);
  const zoomRef = useRef(zoom);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  // During drag, overlay iframes with transparent shields so pointer events aren't swallowed
  const { addIframeShields, removeIframeShields } = useIframeShields(canvasRef);

  // Track last hovered tab header for tabbed containers
  const lastTabHoverRef = useLastTabHover();

  const handleDragMove = useCallback(
    (ev: DragMoveEvent) => {
      const { over, delta, activatorEvent } = ev;
      if (!over || !isPointerEvent(activatorEvent)) {
        setCurrentOverId(null);
        setDropAllowed(null);
        return;
      }
      const overData = over.data.current as { index?: number };
      const visible = getVisibleComponents(components, editor, viewport);
      const rawYScreen = activatorEvent.clientY + delta.y;
      const rawXScreen = activatorEvent.clientX + delta.x;
      const canvasRect = canvasRef?.current?.getBoundingClientRect();
      const pointerCanvasPoint: Point = canvasRect
        ? screenToCanvas({ x: rawXScreen, y: rawYScreen }, canvasRect, zoomRef.current)
        : { x: rawXScreen, y: rawYScreen };
      const pointerXCanvas = pointerCanvasPoint.x;
      const snapX = snapToGrid(pointerXCanvas, gridSize);
      setSnapPosition(snapX);
      // Auto-scroll when near edges of the scroll container
      autoScroll(scrollRef, rawXScreen, rawYScreen, AUTOSCROLL_EDGE_PX, AUTOSCROLL_MAX_SPEED_PX);

      // Dev tracing (only when pb:devtools is enabled)
      try {
        const enabled = typeof localStorage !== 'undefined' && localStorage.getItem('pb:devtools') === '1';
        if (enabled) {
          safeDispatchEvent('pb-dev:drag-move', { t: Date.now(), x: rawXScreen, y: rawYScreen, overId: over.id });
        }
      } catch {}
      setCurrentOverId(String(over.id));
      // Compute drop-allowed for current context
      // Determine parentId for the drop target
      let parentId: string | undefined;
      if (over.id === "canvas") {
        parentId = undefined;
      } else {
        const overId = over.id.toString();
        if (overId.startsWith("container-")) {
          parentId = overId.replace(/^container-/, "");
        } else {
          // infer parent from tree
          parentId = findParentId(components, overId, undefined);
        }
      }
      const parentKind = resolveParentKind(components, parentId);
      const a = ev.active.data.current as { from?: DragFrom; type?: ComponentType; template?: PageComponent; templates?: PageComponent[] };
      let allowed: boolean | null = null;
      if (a?.from === "palette") {
        allowed = a.type ? canDropChild(parentKind, a.type) : true;
      } else if (a?.from === "library") {
        const arr = (a.templates && a.templates.length ? a.templates : (a.template ? [a.template] : [])) as PageComponent[];
        if (arr && arr.length) {
          allowed = arr.every((n) => canDropChild(parentKind, (n.type as unknown) as ComponentType));
        } else {
          allowed = null;
        }
      } else {
        // canvas move
        const movingType = getTypeOfId(components, ev.active.id) || (a?.type as ComponentType | null);
        allowed = movingType ? canDropChild(parentKind, movingType) : null;
      }
      setDropAllowed(allowed);
      // Determine intended insert target and index
      if (over.id === "canvas") {
        setInsertParentId(undefined);
        setInsertIndex(visible.length);
        return;
      }
      // Parent id already derived above
      if (over.id.toString().startsWith("container-")) {
        // Dropping into empty space of a container: insert at end
        const pid = parentId;
        setInsertParentId(pid);
        if (pid) {
          const parent = findById(components, pid);
          const children = parent && Array.isArray((parent as { children?: PageComponent[] }).children)
            ? getVisibleComponents((parent as { children?: PageComponent[] }).children as PageComponent[], editor, viewport)
            : [];
          setInsertIndex(children.length);
        } else {
          setInsertIndex(visible.length);
        }
        return;
      }
      // Over a child item: compute index relative to its parent
      const isBelow = rawYScreen > over.rect.top + over.rect.height / 2;
      const base = (overData?.index ?? visible.length);
      const index = base + (isBelow ? 1 : 0);
      setInsertParentId(parentId);
      setInsertIndex(index);
    },
    [components, gridSize, canvasRef, setSnapPosition, editor, viewport, scrollRef]
  );

  const handleDragEndInternal = useCallback(
    (ev: DragEndEvent) => {
      setInsertIndex(null);
      setSnapPosition(null);
      removeIframeShields();

      if (dragMeta) {
        const dataRef = ev.active?.data as { current: Record<string, unknown> | null | undefined } | undefined;
        const existing =
          dataRef && dataRef.current && typeof dataRef.current === "object"
            ? (dataRef.current as Record<string, unknown>)
            : {};
        const from = (existing.from as DragFrom | undefined) ?? dragMeta.from;
        const patched: Record<string, unknown> = { ...existing };
        if (from) patched.from = from;
        if ((from === "palette" || from === "library") && dragMeta.type) {
          patched.type = dragMeta.type;
        } else if (patched.type === undefined && dragMeta.type) {
          patched.type = dragMeta.type;
        }
        if ((ev.active?.id === undefined || ev.active?.id === null) && dragMeta.id) {
          (ev.active as { id: string | number }).id = dragMeta.id;
        }
        if (dataRef) {
          dataRef.current = patched;
        } else if (ev.active?.data) {
          (ev.active.data as { current: Record<string, unknown> }).current = patched;
        }
      }

      // Defer drag result processing to single-purpose module
      finalizeDrop({
        ev,
        components,
        dispatch,
        defaults,
        containerTypes,
        selectId,
        t,
        lastTabHoverRef,
      });
    },
    [
      dispatch,
      components,
      containerTypes,
      defaults,
      selectId,
      setSnapPosition,
      t,
      removeIframeShields,
      lastTabHoverRef,
      dragMeta,
    ]
  );

  const handleDragStart = useCallback((ev: DragStartEvent) => {
      const a = ev.active.data.current as { type?: ComponentType; from?: DragFrom; template?: PageComponent; templates?: PageComponent[]; label?: string; thumbnail?: string | null };
      setActiveType(a?.type ?? null);
      setDragMeta({ from: (a?.from as DragFrom) ?? "canvas", type: a?.type as ComponentType | undefined, count: Array.isArray(a?.templates) ? a?.templates?.length : (a?.template ? 1 : undefined), id: String(ev.active.id), label: a?.label, thumbnail: a?.thumbnail ?? null });
      setCurrentOverId(null);
      setDropAllowed(null);
      // Add iframe shields to avoid losing pointer events
      addIframeShields();
      safeDispatchEvent('pb-drag-start');
  }, [addIframeShields]);

  const handleDragEnd = useCallback(
    (ev: DragEndEvent) => {
      setActiveType(null);
      handleDragEndInternal(ev);
      setCurrentOverId(null);
      setDropAllowed(null);
      setDragMeta(null);
      safeDispatchEvent('pb-drag-end');
    },
    [handleDragEndInternal]
  );

  const handleDragCancel = useCallback(() => {
    // Clear any transient UI when drag cancels
    setInsertIndex(null);
    setSnapPosition(null);
    setActiveType(null);
    setCurrentOverId(null);
    setDropAllowed(null);
    setDragMeta(null);
    removeIframeShields();
    safeDispatchEvent('pb-live-message', (typeof t === 'function' ? t('canceled') : 'Canceled'))
  }, [setSnapPosition, t, removeIframeShields]);

  const dndContext = {
    sensors,
    collisionDetection: closestCenter,
    onDragStart: handleDragStart,
    onDragMove: handleDragMove,
    onDragEnd: handleDragEnd,
    onDragCancel: handleDragCancel,
  } as const;

  return {
    sensors,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
    insertIndex,
    insertParentId,
    activeType,
    dragMeta,
    dropAllowed,
    currentOverId,
    dndContext,
  };
}

export default usePageBuilderDnD;

// Re-export autoscroll tuning constants for DevTools consumers
export { AUTOSCROLL_EDGE_PX, AUTOSCROLL_MAX_SPEED_PX };
