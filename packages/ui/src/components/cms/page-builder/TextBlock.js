"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { CSS } from "@dnd-kit/utilities";
import { EditorContent } from "@tiptap/react";
import { memo, useCallback, useRef, useState } from "react";
import DOMPurify from "dompurify";
import MenuBar from "./MenuBar";
import useTextEditor from "./useTextEditor";
import useSortableBlock from "./useSortableBlock";
import useCanvasResize from "./useCanvasResize";
import useCanvasDrag from "./useCanvasDrag";
const TextBlock = memo(function TextBlock({ component, index, parentId, selectedId, onSelectId, onRemove, dispatch, locale, gridEnabled = false, gridCols, viewport, }) {
    const selected = selectedId === component.id;
    const { attributes, listeners, setNodeRef, transform, isDragging, } = useSortableBlock(component.id, index, parentId);
    const containerRef = useRef(null);
    const [editing, setEditing] = useState(false);
    const widthKey = viewport === "desktop"
        ? "widthDesktop"
        : viewport === "tablet"
            ? "widthTablet"
            : "widthMobile";
    const heightKey = viewport === "desktop"
        ? "heightDesktop"
        : viewport === "tablet"
            ? "heightTablet"
            : "heightMobile";
    const widthVal = component[widthKey] ??
        component.width;
    const heightVal = component[heightKey] ??
        component.height;
    const marginKey = viewport === "desktop"
        ? "marginDesktop"
        : viewport === "tablet"
            ? "marginTablet"
            : "marginMobile";
    const paddingKey = viewport === "desktop"
        ? "paddingDesktop"
        : viewport === "tablet"
            ? "paddingTablet"
            : "paddingMobile";
    const marginVal = component[marginKey] ??
        component.margin;
    const paddingVal = component[paddingKey] ??
        component.padding;
    const { startResize, guides: resizeGuides, snapping: resizeSnapping, } = useCanvasResize({
        componentId: component.id,
        widthKey,
        heightKey,
        widthVal,
        heightVal,
        dispatch,
        gridEnabled,
        gridCols,
        containerRef,
        disabled: editing,
    });
    const { startDrag, guides: dragGuides, snapping: dragSnapping, } = useCanvasDrag({
        componentId: component.id,
        dispatch,
        gridEnabled,
        gridCols,
        containerRef,
        disabled: editing,
    });
    const guides = resizeGuides.x !== null || resizeGuides.y !== null
        ? resizeGuides
        : dragGuides;
    const snapping = resizeSnapping || dragSnapping;
    const editor = useTextEditor(component, locale, editing);
    const { id: componentId, text: componentText } = component;
    const finishEdit = useCallback(() => {
        if (!editor)
            return;
        dispatch({
            type: "update",
            id: componentId,
            patch: {
                text: {
                    ...(typeof componentText === "object" ? componentText : {}),
                    [locale]: editor.getHTML(),
                },
            },
        });
        setEditing(false);
    }, [editor, dispatch, locale, componentId, componentText]);
    return (_jsxs("div", { ref: (node) => {
            setNodeRef(node);
            containerRef.current = node;
        }, onClick: () => onSelectId(component.id), role: "listitem", "aria-grabbed": isDragging, tabIndex: 0, style: {
            transform: CSS.Transform.toString(transform),
            ...(widthVal ? { width: widthVal } : {}),
            ...(heightVal ? { height: heightVal } : {}),
            ...(marginVal ? { margin: marginVal } : {}),
            ...(paddingVal ? { padding: paddingVal } : {}),
            ...(component.position ? { position: component.position } : {}),
            ...(component.top ? { top: component.top } : {}),
            ...(component.left ? { left: component.left } : {}),
        }, className: "relative rounded border" +
            (selected ? " ring-2 ring-blue-500" : "") +
            (snapping ? " border-primary" : ""), children: [_jsx("div", { className: "absolute left-0 top-0 z-10 h-3 w-3 cursor-move bg-muted", ...attributes, ...listeners, role: "button", tabIndex: 0, "aria-grabbed": isDragging, title: "Drag or press space/enter to move", onPointerDown: (e) => {
                    e.stopPropagation();
                    onSelectId(component.id);
                    startDrag(e);
                } }), (guides.x !== null || guides.y !== null) && (_jsxs("div", { className: "pointer-events-none absolute inset-0 z-20", children: [guides.x !== null && (_jsx("div", { className: "absolute top-0 bottom-0 w-px bg-primary", style: { left: guides.x } })), guides.y !== null && (_jsx("div", { className: "absolute left-0 right-0 h-px bg-primary", style: { top: guides.y } }))] })), editing ? (_jsxs("div", { onBlur: finishEdit, onClick: (e) => e.stopPropagation(), children: [_jsx(MenuBar, { editor: editor }), _jsx(EditorContent, { editor: editor, className: "min-h-[1rem] outline-none", onKeyDown: (e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                finishEdit();
                            }
                        } })] })) : (_jsx("div", { onClick: (e) => {
                    e.stopPropagation();
                    setEditing(true);
                    onSelectId(component.id);
                }, dangerouslySetInnerHTML: {
                    __html: DOMPurify.sanitize(typeof component.text === "string"
                        ? component.text
                        : component.text?.[locale] ?? ""),
                } })), selected && (_jsxs(_Fragment, { children: [_jsx("div", { onPointerDown: startResize, className: "absolute -top-1 -left-1 h-2 w-2 cursor-nwse-resize bg-primary" }), _jsx("div", { onPointerDown: startResize, className: "absolute -top-1 -right-1 h-2 w-2 cursor-nesw-resize bg-primary" }), _jsx("div", { onPointerDown: startResize, className: "absolute -bottom-1 -left-1 h-2 w-2 cursor-nesw-resize bg-primary" }), _jsx("div", { onPointerDown: startResize, className: "absolute -right-1 -bottom-1 h-2 w-2 cursor-nwse-resize bg-primary" })] })), _jsx("button", { type: "button", onClick: onRemove, className: "absolute top-1 right-1 rounded bg-danger px-2 text-xs", "data-token": "--color-danger", children: _jsx("span", { className: "text-danger-foreground", "data-token": "--color-danger-fg", children: "\u00D7" }) })] }));
});
export default TextBlock;
