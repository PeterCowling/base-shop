"use client";
import {
  DragEndEvent,
  DragMoveEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { ulid } from "ulid";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PageComponent, HistoryState } from "@acme/types";
import type { Action } from "../state";
import { snapToGrid } from "../gridSnap";
import type { ComponentType } from "../defaults";
import { isHiddenForViewport } from "../state/layout/utils";
import { screenToCanvas } from "../utils/coords";

const noop = () => {};

function isPointerEvent(
  ev: Event | null | undefined
): ev is PointerEvent {
  return !!ev && "clientX" in ev && "clientY" in ev;
}

function hasChildren(
  c: PageComponent
): c is PageComponent & { children: PageComponent[] } {
  return Array.isArray((c as { children?: unknown }).children);
}

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
}: Params) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [activeType, setActiveType] = useState<ComponentType | null>(null);
  const lastTabHoverRef = useRef<{ parentId: string; tabIndex: number } | null>(null);
  const zoomRef = useRef(zoom);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  useEffect(() => {
    const onHover = (e: Event) => {
      try {
        const ce = e as CustomEvent<{ parentId: string; tabIndex: number }>;
        if (ce?.detail && typeof ce.detail.parentId === 'string' && typeof ce.detail.tabIndex === 'number') {
          lastTabHoverRef.current = { parentId: ce.detail.parentId, tabIndex: ce.detail.tabIndex };
        }
      } catch {}
    };
    window.addEventListener('pb-tab-hover', onHover as any);
    return () => window.removeEventListener('pb-tab-hover', onHover as any);
  }, []);

  const handleDragMove = useCallback(
    (ev: DragMoveEvent) => {
      const { over, delta, activatorEvent } = ev;
      if (!over || !isPointerEvent(activatorEvent)) return;
      const overData = over.data.current as { index?: number };
      const visible = components.filter((c) => !isHiddenForViewport(c.id, editor, (c as any).hidden as boolean | undefined, viewport));
      const rawYScreen = activatorEvent.clientY + delta.y;
      const rawXScreen = activatorEvent.clientX + delta.x;
      const canvasRect = canvasRef?.current?.getBoundingClientRect();
      const { x: pointerXCanvas, y: pointerYCanvas } = canvasRect
        ? screenToCanvas({ x: rawXScreen, y: rawYScreen }, canvasRect, zoomRef.current)
        : { x: rawXScreen, y: rawYScreen };
      const snapX = snapToGrid(pointerXCanvas, gridSize);
      const pointerY = pointerYCanvas;
      setSnapPosition(snapX);
      // Auto-scroll when near edges of the scroll container
      try {
        const sc = scrollRef?.current;
        if (sc) {
          const rect = sc.getBoundingClientRect();
          const edge = 40; // px edge threshold
          const pageY = rawYScreen;
          const pageX = rawXScreen;
          if (pageY < rect.top + edge) sc.scrollBy({ top: -20, behavior: "auto" });
          else if (pageY > rect.bottom - edge) sc.scrollBy({ top: 20, behavior: "auto" });
          if (pageX < rect.left + edge) sc.scrollBy({ left: -20, behavior: "auto" });
          else if (pageX > rect.right - edge) sc.scrollBy({ left: 20, behavior: "auto" });
        }
      } catch {}
      if (over.id === "canvas") {
        setInsertIndex(visible.length);
        return;
      }
      // Compare using screen-space for droppable rects
      const isBelow = rawYScreen > over.rect.top + over.rect.height / 2;
      const index = (overData?.index ?? visible.length) + (isBelow ? 1 : 0);
      setInsertIndex(index);
    },
    [components, gridSize, canvasRef, setSnapPosition, editor, viewport, scrollRef, zoom]
  );

  const handleDragEndInternal = useCallback(
    (ev: DragEndEvent) => {
      setInsertIndex(null);
      setSnapPosition(null);
      const { active, over } = ev;
      if (!over) return;
      const a = active.data.current as {
        from: string;
        type?: ComponentType;
        index?: number;
        parentId?: string;
        template?: PageComponent;
        templates?: PageComponent[];
      };
      const o = (over.data.current || {}) as {
        parentId?: string;
        index?: number;
      };
      const findById = (
        list: PageComponent[],
        id: string
      ): PageComponent | null => {
        for (const c of list) {
          if (c.id === id) return c;
          const children = hasChildren(c) ? c.children : undefined;
          if (children) {
            const found = findById(children, id);
            if (found) return found;
          }
        }
        return null;
      };
      let parentId = o.parentId;
      let index = o.index;
      if (over.id === "canvas") {
        parentId = undefined;
        index = components.length;
      } else if (parentId === undefined) {
        parentId = over.id.toString().replace(/^container-/, "");
        const parent = findById(components, parentId);
        index = parent ? (hasChildren(parent) ? parent.children.length : 0) : 0;
      }
      if (a?.from === "palette") {
        const isContainer = containerTypes.includes(a.type!);
        const component = {
          id: ulid(),
          type: a.type! as PageComponent["type"],
          ...(defaults[a.type!] ?? {}),
          ...(isContainer ? { children: [] } : {}),
        } as PageComponent;
        // Assign tab slot if dropping into tabbed container and a header is hovered
        if (parentId && lastTabHoverRef.current?.parentId === parentId) {
          const parent = findById(components, parentId);
          const isTabbed = parent && (parent.type === 'Tabs' || parent.type === 'TabsAccordionContainer');
          if (isTabbed) (component as any).slotKey = String(lastTabHoverRef.current.tabIndex);
        }
        dispatch({
          type: "add",
          component,
          parentId,
          index: index ?? 0,
        });
        selectId(component.id);
      } else if (a?.from === "library" && (a.template || (a.templates && a.templates.length))) {
        // Deep clone template(s) and assign new ids
        const cloneWithIds = (node: PageComponent): PageComponent => {
          const cloned: any = { ...(node as any), id: ulid() };
          const children = (node as any).children as PageComponent[] | undefined;
          if (Array.isArray(children)) cloned.children = children.map(cloneWithIds);
          return cloned as PageComponent;
        };
        const list = (a.templates && a.templates.length ? a.templates : (a.template ? [a.template] : [])) as PageComponent[];
        const clones = list.map(cloneWithIds);
        if (parentId && lastTabHoverRef.current?.parentId === parentId) {
          const parent = findById(components, parentId);
          const isTabbed = parent && (parent.type === 'Tabs' || parent.type === 'TabsAccordionContainer');
          if (isTabbed) {
            clones.forEach((c) => { (c as any).slotKey = String(lastTabHoverRef.current!.tabIndex); });
          }
        }
        // Insert sequentially, preserving order
        let insertedFirstId: string | null = null;
        clones.forEach((component, i) => {
          dispatch({ type: "add", component, parentId, index: (index ?? 0) + i });
          if (!insertedFirstId) insertedFirstId = component.id;
        });
        if (insertedFirstId) selectId(insertedFirstId);
      } else if (a?.from === "canvas") {
        let toIndex = index ?? 0;
        if (a.parentId === parentId && a.index! < (index ?? 0)) {
          toIndex = (index ?? 0) - 1;
        }
        dispatch({
          type: "move",
          from: { parentId: a.parentId, index: a.index! },
          to: { parentId, index: toIndex },
        });
        // Assign slotKey if dropping into tabbed container with hovered header
        if (parentId && lastTabHoverRef.current?.parentId === parentId) {
          const parent = findById(components, parentId);
          const isTabbed = parent && (parent.type === 'Tabs' || parent.type === 'TabsAccordionContainer');
          if (isTabbed) {
            const movedId = String(ev.active.id);
            dispatch({ type: 'update', id: movedId, patch: { slotKey: String(lastTabHoverRef.current.tabIndex) } as any });
            try { window.dispatchEvent(new CustomEvent('pb-live-message', { detail: `Moved to tab ${lastTabHoverRef.current.tabIndex + 1}` })); } catch {}
          }
        }
      }
    },
    [dispatch, components, containerTypes, defaults, selectId, setSnapPosition]
  );

  const handleDragStart = useCallback((ev: DragStartEvent) => {
      const a = ev.active.data.current as { type?: ComponentType };
      setActiveType(a?.type ?? null);
      try { window.dispatchEvent(new CustomEvent('pb-drag-start')); } catch {}
  }, []);

  const handleDragEnd = useCallback(
    (ev: DragEndEvent) => {
      setActiveType(null);
      handleDragEndInternal(ev);
      try { window.dispatchEvent(new CustomEvent('pb-drag-end')); } catch {}
    },
    [handleDragEndInternal]
  );

  const dndContext = {
    sensors,
    collisionDetection: closestCenter,
    onDragStart: handleDragStart,
    onDragMove: handleDragMove,
    onDragEnd: handleDragEnd,
  } as const;

  return {
    sensors,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    insertIndex,
    activeType,
    dndContext,
  };
}

export default usePageBuilderDnD;
