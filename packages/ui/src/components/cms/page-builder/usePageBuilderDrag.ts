import {
  DragEndEvent,
  DragMoveEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { ulid } from "ulid";
import { useCallback } from "react";
import type React from "react";
import type { PageComponent } from "@acme/types";
import type { Action } from "./state";

interface Params {
  components: PageComponent[];
  dispatch: (action: Action) => void;
  defaults: Partial<Record<string, Partial<PageComponent>>>;
  containerTypes: string[];
  setInsertIndex: (i: number | null) => void;
  selectId: (id: string) => void;
  gridSize?: number;
  canvasRef?: React.RefObject<HTMLDivElement>;
  setSnapPosition?: (x: number | null) => void;
}

export const snapToGrid = (value: number, gridSize: number) =>
  Math.round(value / gridSize) * gridSize;

export function usePageBuilderDrag({
  components,
  dispatch,
  defaults,
  containerTypes,
  setInsertIndex,
  selectId,
  gridSize = 1,
  canvasRef,
  setSnapPosition = () => {},
}: Params) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragMove = useCallback(
    (ev: DragMoveEvent) => {
      const { over, delta } = ev;
      if (!over) return;
      const overData = over.data.current as { index?: number };
      const rawY = (ev.activatorEvent as any)?.clientY + delta.y;
      const pointerY = snapToGrid(rawY, gridSize);
      const rawX = (ev.activatorEvent as any)?.clientX + delta.x;
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      const pointerX = rawX - (canvasRect?.left ?? 0);
      const snapX = snapToGrid(pointerX, gridSize);
      setSnapPosition(snapX);
      if (over.id === "canvas") {
        setInsertIndex(components.length);
        return;
      }
      const isBelow = pointerY > over.rect.top + over.rect.height / 2;
      const index = (overData?.index ?? components.length) + (isBelow ? 1 : 0);
      setInsertIndex(index);
    },
    [components.length, setInsertIndex, gridSize, canvasRef, setSnapPosition]
  );

  const handleDragEnd = useCallback(
    (ev: DragEndEvent) => {
      setInsertIndex(null);
      setSnapPosition(null);
      const { active, over } = ev;
      if (!over) return;
      const a = active.data.current as {
        from: string;
        type?: string;
        index?: number;
        parentId?: string;
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
          if ((c as any).children) {
            const found = findById((c as any).children, id);
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
        index = ((parent as any)?.children?.length ?? 0) as number;
      }
      if (a?.from === "palette") {
        const isContainer = containerTypes.includes(a.type!);
        const component = {
          id: ulid(),
          type: a.type! as any,
          ...(defaults[a.type! as any] ?? {}),
          ...(isContainer ? { children: [] } : {}),
        } as PageComponent;
        dispatch({
          type: "add",
          component,
          parentId,
          index: index ?? 0,
        });
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
    [dispatch, components, containerTypes, defaults, setInsertIndex, selectId]
  );

  return { sensors, handleDragMove, handleDragEnd };
}

export default usePageBuilderDrag;
