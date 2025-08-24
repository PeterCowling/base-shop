"use client";
import { DragEndEvent, DragMoveEvent, DragStartEvent, KeyboardSensor, PointerSensor, useSensor, useSensors, } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { ulid } from "ulid";
import { useCallback, useState } from "react";
import { snapToGrid } from "../gridSnap";
const noop = () => { };
function isPointerEvent(ev) {
    return !!ev && "clientX" in ev && "clientY" in ev;
}
function hasChildren(c) {
    return Array.isArray(c.children);
}
export function usePageBuilderDnD({ components, dispatch, defaults, containerTypes, selectId, gridSize = 1, canvasRef, setSnapPosition = noop, }) {
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
    const [insertIndex, setInsertIndex] = useState(null);
    const [activeType, setActiveType] = useState(null);
    const handleDragMove = useCallback((ev) => {
        const { over, delta, activatorEvent } = ev;
        if (!over || !isPointerEvent(activatorEvent))
            return;
        const overData = over.data.current;
        const rawY = activatorEvent.clientY + delta.y;
        const pointerY = snapToGrid(rawY, gridSize);
        const rawX = activatorEvent.clientX + delta.x;
        const canvasRect = canvasRef?.current?.getBoundingClientRect();
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
    }, [components.length, gridSize, canvasRef, setSnapPosition]);
    const handleDragEndInternal = useCallback((ev) => {
        setInsertIndex(null);
        setSnapPosition(null);
        const { active, over } = ev;
        if (!over)
            return;
        const a = active.data.current;
        const o = (over.data.current || {});
        const findById = (list, id) => {
            for (const c of list) {
                if (c.id === id)
                    return c;
                const children = hasChildren(c) ? c.children : undefined;
                if (children) {
                    const found = findById(children, id);
                    if (found)
                        return found;
                }
            }
            return null;
        };
        let parentId = o.parentId;
        let index = o.index;
        if (over.id === "canvas") {
            parentId = undefined;
            index = components.length;
        }
        else if (parentId === undefined) {
            parentId = over.id.toString().replace(/^container-/, "");
            const parent = findById(components, parentId);
            index = parent ? (hasChildren(parent) ? parent.children.length : 0) : 0;
        }
        if (a?.from === "palette") {
            const isContainer = containerTypes.includes(a.type);
            const component = {
                id: ulid(),
                type: a.type,
                ...(defaults[a.type] ?? {}),
                ...(isContainer ? { children: [] } : {}),
            };
            dispatch({
                type: "add",
                component,
                parentId,
                index: index ?? 0,
            });
            selectId(component.id);
        }
        else if (a?.from === "canvas") {
            let toIndex = index ?? 0;
            if (a.parentId === parentId && a.index < (index ?? 0)) {
                toIndex = (index ?? 0) - 1;
            }
            dispatch({
                type: "move",
                from: { parentId: a.parentId, index: a.index },
                to: { parentId, index: toIndex },
            });
        }
    }, [dispatch, components, containerTypes, defaults, selectId, setSnapPosition]);
    const handleDragStart = useCallback((ev) => {
        const a = ev.active.data.current;
        setActiveType(a?.type ?? null);
    }, []);
    const handleDragEnd = useCallback((ev) => {
        setActiveType(null);
        handleDragEndInternal(ev);
    }, [handleDragEndInternal]);
    return { sensors, handleDragStart, handleDragMove, handleDragEnd, insertIndex, activeType };
}
export default usePageBuilderDnD;
