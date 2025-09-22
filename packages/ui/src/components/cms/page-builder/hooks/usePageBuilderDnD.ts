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
import { canDropChild, type ParentKind } from "../rules";
import { isHiddenForViewport } from "../state/layout/utils";
import { screenToCanvas } from "../utils/coords";
import type { Point } from "../utils/coords";

const noop = () => {};

// Expose autoscroll tuning so DevTools can visualize thresholds
export const AUTOSCROLL_EDGE_PX = 48;
export const AUTOSCROLL_MAX_SPEED_PX = 28;

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
  const sensors = useSensors(
    // Add activation constraints to reduce accidental drags, esp. touch/stylus
    useSensor(PointerSensor, {
      activationConstraint: {
        // Small distance helps avoid accidental drags while clicking
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [insertParentId, setInsertParentId] = useState<string | undefined>(undefined);
  const [activeType, setActiveType] = useState<ComponentType | null>(null);
  const [dragMeta, setDragMeta] = useState<{ from: DragFrom; type?: ComponentType; count?: number; id?: string; label?: string; thumbnail?: string | null } | null>(null);
  const [currentOverId, setCurrentOverId] = useState<string | null>(null);
  const [dropAllowed, setDropAllowed] = useState<boolean | null>(null);
  const lastTabHoverRef = useRef<{ parentId: string; tabIndex: number } | null>(null);
  const zoomRef = useRef(zoom);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  // During drag, overlay iframes with transparent shields so pointer events aren't swallowed
  const iframeShieldsRef = useRef<HTMLElement[]>([]);
  const addIframeShields = useCallback(() => {
    try {
      const root = canvasRef?.current ?? (typeof document !== 'undefined' ? document.getElementById('canvas') : null);
      if (!root) return;
      const iframes = root.querySelectorAll('iframe');
      const shields: HTMLElement[] = [];
      iframes.forEach((frame) => {
        const f = frame as HTMLElement;
        const r = f.getBoundingClientRect();
        const base = root.getBoundingClientRect();
        const shield = document.createElement('div');
        shield.className = 'pb-iframe-shield';
        const style: Partial<CSSStyleDeclaration> = {
          position: 'absolute',
          left: `${r.left - base.left}px`,
          top: `${r.top - base.top}px`,
          width: `${r.width}px`,
          height: `${r.height}px`,
          zIndex: '50',
          background: 'transparent',
          pointerEvents: 'auto',
        };
        Object.assign(shield.style, style as unknown as Record<string, string>);
        root.appendChild(shield);
        shields.push(shield);
      });
      iframeShieldsRef.current = shields;
    } catch {
      // ignore
    }
  }, [canvasRef]);
  const removeIframeShields = useCallback(() => {
    try { iframeShieldsRef.current.forEach((el) => el.parentElement?.removeChild(el)); } catch {}
    iframeShieldsRef.current = [];
  }, []);

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
      if (!over || !isPointerEvent(activatorEvent)) {
        setCurrentOverId(null);
        setDropAllowed(null);
        return;
      }
      const overData = over.data.current as { index?: number };
      const visible = components.filter((c) => !isHiddenForViewport(c.id, editor, (c as any).hidden as boolean | undefined, viewport));
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
      try {
        const sc = scrollRef?.current;
        if (sc) {
          const rect = sc.getBoundingClientRect();
          const edge = AUTOSCROLL_EDGE_PX; // threshold in px
          const maxSpeed = AUTOSCROLL_MAX_SPEED_PX; // px per event step
          const pageY = rawYScreen;
          const pageX = rawXScreen;
          const topDist = Math.max(0, pageY - rect.top);
          const bottomDist = Math.max(0, rect.bottom - pageY);
          const leftDist = Math.max(0, pageX - rect.left);
          const rightDist = Math.max(0, rect.right - pageX);
          const speed = (d: number) => {
            const within = Math.max(0, edge - d);
            return within > 0 ? Math.ceil((within / edge) * maxSpeed) : 0;
          };
          const vUp = speed(topDist);
          const vDown = speed(bottomDist);
          const vLeft = speed(leftDist);
          const vRight = speed(rightDist);
          if (vUp && pageY < rect.top + edge) sc.scrollBy({ top: -vUp, behavior: "auto" });
          else if (vDown && pageY > rect.bottom - edge) sc.scrollBy({ top: vDown, behavior: "auto" });
          if (vLeft && pageX < rect.left + edge) sc.scrollBy({ left: -vLeft, behavior: "auto" });
          else if (vRight && pageX > rect.right - edge) sc.scrollBy({ left: vRight, behavior: "auto" });
        }
      } catch {}

      // Dev tracing (only when pb:devtools is enabled)
      try {
        const enabled = typeof localStorage !== 'undefined' && localStorage.getItem('pb:devtools') === '1';
        if (enabled) {
          window.dispatchEvent(new CustomEvent('pb-dev:drag-move', {
            detail: {
              t: Date.now(),
              x: rawXScreen,
              y: rawYScreen,
              overId: over.id,
            }
          }));
        }
      } catch {}
      setCurrentOverId(String(over.id));
      // Compute drop-allowed for current context
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
      const getTypeOfId = (id: string | number | symbol | undefined): ComponentType | null => {
        if (!id) return null;
        const node = findById(components, String(id));
        return (node?.type as ComponentType) || null;
      };
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
          const findParentId = (list: PageComponent[], target: string, pid?: string): string | undefined => {
            for (const c of list) {
              if (c.id === target) return pid;
              const children = (c as { children?: PageComponent[] }).children;
              if (Array.isArray(children)) {
                const res = findParentId(children, target, c.id);
                if (res !== undefined) return res;
              }
            }
            return undefined;
          };
          parentId = findParentId(components, overId, undefined);
        }
      }
      const parentKind: ParentKind = parentId ? ((findById(components, parentId)?.type as ComponentType) || ("" as ComponentType)) : "ROOT";
      const a = ev.active.data.current as { from?: DragFrom; type?: ComponentType; template?: PageComponent; templates?: PageComponent[] };
      let allowed: boolean | null = null;
      if (a?.from === "palette") {
        allowed = a.type ? canDropChild(parentKind, a.type) : true;
      } else if (a?.from === "library") {
        const arr = (a.templates && a.templates.length ? a.templates : (a.template ? [a.template] : [])) as PageComponent[];
        if (arr && arr.length) {
          allowed = arr.every((n) => canDropChild(parentKind, (n as any).type as ComponentType));
        } else {
          allowed = null;
        }
      } else {
        // canvas move
        const movingType = getTypeOfId(ev.active.id) || (a?.type as ComponentType | null);
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
          const children = parent && hasChildren(parent) ? parent.children.filter((c) => !isHiddenForViewport(c.id, editor, (c as any).hidden as boolean | undefined, viewport)) : [];
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
        // If "over" points to a non-container node, interpret drop as
        // inserting into its parent before the over node (or at root).
        if (!over.id.toString().startsWith("container-") && (!parent || !hasChildren(parent))) {
          const overId = over.id.toString();
          const findParentId = (list: PageComponent[], target: string, pid?: string): string | undefined => {
            for (const c of list) {
              if (c.id === target) return pid;
              const children = (c as { children?: PageComponent[] }).children;
              if (Array.isArray(children)) {
                const res = findParentId(children, target, c.id);
                if (res !== undefined) return res;
              }
            }
            return undefined;
          };
          const actualParentId = findParentId(components, overId, undefined);
          parentId = actualParentId;
          if (parentId) {
            const p = findById(components, parentId);
            const children = p && hasChildren(p) ? p.children : [];
            index = Math.max(0, children.findIndex((c) => c.id === overId));
          } else {
            index = Math.max(0, components.findIndex((c) => c.id === overId));
          }
        }
      }
      // Resolve parent kind for placement rules
      const parentKind: ParentKind = parentId ? ((findById(components, parentId)?.type as ComponentType) || ("" as ComponentType)) : "ROOT";
      const getTypeOfId = (id: string | number | symbol | undefined): ComponentType | null => {
        if (!id) return null;
        const node = findById(components, String(id));
        return (node?.type as ComponentType) || null;
      };
      if (a?.from === "palette") {
        const isContainer = containerTypes.includes(a.type!);
        // Enforce placement rules for new palette items
        if (!canDropChild(parentKind, a.type as ComponentType)) {
          try { window.dispatchEvent(new CustomEvent('pb-live-message', { detail: (typeof t === 'function' ? t('cannotPlace', { type: a.type }) : `Cannot place ${a.type} here`) })); } catch {}
          return;
        }
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
        // Enforce rules for all top-level cloned nodes
        const invalid = clones.find((c) => !canDropChild(parentKind, (c as any).type as ComponentType));
        if (invalid) {
          try { window.dispatchEvent(new CustomEvent('pb-live-message', { detail: (typeof t === 'function' ? t('cannotPlace', { type: String((invalid as any).type) }) : `Cannot place ${String((invalid as any).type)} here`) })); } catch {}
          return;
        }
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
        // Enforce placement rules for moving existing components
        const movingType = getTypeOfId(ev.active.id) || (a.type as ComponentType | null);
        if (movingType && !canDropChild(parentKind, movingType)) {
          try { window.dispatchEvent(new CustomEvent('pb-live-message', { detail: (typeof t === 'function' ? t('cannotMove', { type: String(movingType) }) : `Cannot move ${String(movingType)} here`) })); } catch {}
          return;
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
            try { window.dispatchEvent(new CustomEvent('pb-live-message', { detail: (typeof t === 'function' ? t('movedToTab', { n: String(lastTabHoverRef.current.tabIndex + 1) }) : `Moved to tab ${lastTabHoverRef.current.tabIndex + 1}`) })); } catch {}
          }
        }
      }
    },
    [dispatch, components, containerTypes, defaults, selectId, setSnapPosition, t]
  );

  const handleDragStart = useCallback((ev: DragStartEvent) => {
      const a = ev.active.data.current as { type?: ComponentType; from?: DragFrom; template?: PageComponent; templates?: PageComponent[]; label?: string; thumbnail?: string | null };
      setActiveType(a?.type ?? null);
      setDragMeta({ from: (a?.from as DragFrom) ?? "canvas", type: a?.type as ComponentType | undefined, count: Array.isArray(a?.templates) ? a?.templates?.length : (a?.template ? 1 : undefined), id: String(ev.active.id), label: a?.label, thumbnail: a?.thumbnail ?? null });
      setCurrentOverId(null);
      setDropAllowed(null);
      // Add iframe shields to avoid losing pointer events
      addIframeShields();
      try { window.dispatchEvent(new CustomEvent('pb-drag-start')); } catch {}
  }, [addIframeShields]);

  const handleDragEnd = useCallback(
    (ev: DragEndEvent) => {
      setActiveType(null);
      handleDragEndInternal(ev);
      setCurrentOverId(null);
      setDropAllowed(null);
      setDragMeta(null);
      try { window.dispatchEvent(new CustomEvent('pb-drag-end')); } catch {}
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
    try { window.dispatchEvent(new CustomEvent('pb-live-message', { detail: (typeof t === 'function' ? t('canceled') : 'Canceled') })); } catch {}
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
