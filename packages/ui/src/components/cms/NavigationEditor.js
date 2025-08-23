// packages/ui/components/cms/NavigationEditor.tsx
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, KeyboardSensor, PointerSensor, useSensor, useSensors, } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DragHandleDots2Icon } from "@radix-ui/react-icons";
import { Fragment, useState } from "react";
import { ulid } from "ulid";
import { Button, Input } from "../atoms/shadcn";
export default function NavigationEditor({ items, onChange }) {
    return (_jsxs("div", { className: "space-y-2", children: [_jsx(NavList, { items: items, onChange: onChange }), _jsx(Button, { onClick: () => onChange([...items, { id: ulid(), label: "", url: "", children: [] }]), children: "Add Item" })] }));
}
function NavList({ items, onChange, level = 0, }) {
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
    const [insertIndex, setInsertIndex] = useState(null);
    const update = (idx, item) => {
        const copy = [...items];
        copy[idx] = item;
        onChange(copy);
    };
    const remove = (idx) => {
        const copy = items.filter((_, i) => i !== idx);
        onChange(copy);
    };
    const addChild = (idx) => {
        const item = items[idx];
        const children = item.children ? [...item.children] : [];
        children.push({ id: ulid(), label: "", url: "", children: [] });
        update(idx, { ...item, children });
    };
    const handleDragStart = (ev) => {
        setInsertIndex(items.findIndex((i) => i.id === ev.active.id));
    };
    const handleDragOver = (ev) => {
        const { over, active } = ev;
        if (!over) {
            setInsertIndex(items.length);
            return;
        }
        const overIndex = items.findIndex((i) => i.id === over.id);
        const activeRect = active.rect.current.translated;
        const isBelow = activeRect && activeRect.top > over.rect.top + over.rect.height / 2;
        setInsertIndex(overIndex + (isBelow ? 1 : 0));
    };
    const handleDragEnd = (ev) => {
        const { active } = ev;
        if (insertIndex !== null) {
            const oldIndex = items.findIndex((i) => i.id === active.id);
            if (oldIndex !== insertIndex) {
                onChange(arrayMove(items, oldIndex, insertIndex));
            }
        }
        setInsertIndex(null);
    };
    return (_jsx(DndContext, { sensors: sensors, onDragStart: handleDragStart, onDragOver: handleDragOver, onDragEnd: handleDragEnd, children: _jsx(SortableContext, { items: items.map((i) => i.id), strategy: verticalListSortingStrategy, children: _jsxs("ul", { className: level ? "ml-4 space-y-2" : "space-y-2", children: [items.map((item, i) => (_jsxs(Fragment, { children: [insertIndex === i && (_jsx("li", { "data-placeholder": true, className: "h-4 rounded border-2 border-dashed border-primary bg-primary/10" })), _jsx(SortableNavItem, { item: item, level: level, update: (it) => update(i, it), remove: () => remove(i), addChild: () => addChild(i) })] }, item.id))), insertIndex === items.length && (_jsx("li", { "data-placeholder": true, className: "h-4 rounded border-2 border-dashed border-primary bg-primary/10" }))] }) }) }));
}
function SortableNavItem({ item, level, update, remove, addChild, }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging, } = useSortable({ id: item.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    return (_jsxs("li", { ref: setNodeRef, style: style, className: "space-y-2" + (isDragging ? " opacity-50" : ""), children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { className: "h-8 w-8 p-0 cursor-grab", variant: "outline", ...attributes, ...listeners, children: _jsx(DragHandleDots2Icon, { className: "h-4 w-4" }) }), _jsx(Input, { value: item.label, onChange: (e) => update({ ...item, label: e.target.value }), placeholder: "Label" }), _jsx(Input, { value: item.url, onChange: (e) => update({ ...item, url: e.target.value }), placeholder: "/path" }), _jsx(Button, { className: "h-8 w-8 p-0", variant: "outline", onClick: addChild, children: "+" }), _jsx(Button, { className: "h-8 w-8 p-0", variant: "outline", onClick: remove, children: "\u2715" })] }), item.children && item.children.length > 0 && (_jsx(NavList, { items: item.children, onChange: (childs) => update({ ...item, children: childs }), level: level + 1 }))] }));
}
