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
import { useCallback, useState } from "react";
import type { PageComponent, HistoryState } from "@acme/types";
import type { Action } from "../state";
import { snapToGrid } from "../gridSnap";
import type { ComponentType } from "../defaults";
import { isHiddenForViewport } from "../state/layout/utils";

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
}: Params) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [insertIndex, setInsertIndex] = useState<number | null>(null);
  const [activeType, setActiveType] = useState<ComponentType | null>(null);

  const handleDragMove = useCallback(
    (ev: DragMoveEvent) => {
      const { over, delta, activatorEvent } = ev;
      if (!over || !isPointerEvent(activatorEvent)) return;
      const overData = over.data.current as { index?: number };
      const visible = components.filter((c) => !isHiddenForViewport(c.id, editor, (c as any).hidden as boolean | undefined, viewport));
      const rawY = activatorEvent.clientY + delta.y;
      const pointerY = snapToGrid(rawY, gridSize);
      const rawX = activatorEvent.clientX + delta.x;
      const canvasRect = canvasRef?.current?.getBoundingClientRect();
      const pointerX = rawX - (canvasRect?.left ?? 0);
      const snapX = snapToGrid(pointerX, gridSize);
      setSnapPosition(snapX);
      if (over.id === "canvas") {
        setInsertIndex(visible.length);
        return;
      }
      const isBelow = pointerY > over.rect.top + over.rect.height / 2;
      const index = (overData?.index ?? visible.length) + (isBelow ? 1 : 0);
      setInsertIndex(index);
    },
    [components, gridSize, canvasRef, setSnapPosition, editor, viewport]
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
        dispatch({
          type: "add",
          component,
          parentId,
          index: index ?? 0,
        });
        selectId(component.id);
      } else if (a?.from === "library" && a.template) {
        // Deep clone template and assign new ids
        const cloneWithIds = (node: PageComponent): PageComponent => {
          const cloned: any = { ...(node as any), id: ulid() };
          const children = (node as any).children as PageComponent[] | undefined;
          if (Array.isArray(children)) cloned.children = children.map(cloneWithIds);
          return cloned as PageComponent;
        };
        const component = cloneWithIds(a.template);
        dispatch({ type: "add", component, parentId, index: index ?? 0 });
        selectId(component.id);
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
      }
    },
    [dispatch, components, containerTypes, defaults, selectId, setSnapPosition]
  );

  const handleDragStart = useCallback((ev: DragStartEvent) => {
      const a = ev.active.data.current as { type?: ComponentType };
      setActiveType(a?.type ?? null);
  }, []);

  const handleDragEnd = useCallback(
    (ev: DragEndEvent) => {
      setActiveType(null);
      handleDragEndInternal(ev);
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
