import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import { Fragment, useState } from "react";
import CanvasItem from "./CanvasItem";
import { cn } from "../../../utils/style";
import GridOverlay from "./GridOverlay";
import SnapLine from "./SnapLine";
import Block from "./Block";
const PageCanvas = ({ components, selectedId = null, onSelectId = () => { }, canvasRef, dragOver = false, setDragOver = () => { }, onFileDrop = () => { }, insertIndex = null, dispatch = () => { }, locale, containerStyle, showGrid = false, gridCols = 1, viewport, snapPosition = null, device, preview = false, }) => {
    const [dropRect, setDropRect] = useState(null);
    const handleDragOver = (e) => {
        if (preview)
            return;
        e.preventDefault();
        setDragOver(true);
        const target = e.target.closest('[role="listitem"], #canvas');
        if (target instanceof HTMLElement && canvasRef?.current) {
            const canvasBounds = canvasRef.current.getBoundingClientRect();
            const rect = target.getBoundingClientRect();
            setDropRect({
                left: rect.left - canvasBounds.left,
                top: rect.top - canvasBounds.top,
                width: rect.width,
                height: rect.height,
            });
        }
        else {
            setDropRect(null);
        }
    };
    const clearHighlight = () => {
        setDragOver(false);
        setDropRect(null);
    };
    if (preview) {
        return (_jsx("div", { id: "canvas", ref: canvasRef, style: containerStyle, className: "relative mx-auto flex flex-col gap-4", children: components.map((c) => (_jsx(Block, { component: c, locale: locale }, c.id))) }));
    }
    return (_jsx(SortableContext, { items: components.map((c) => c.id), strategy: rectSortingStrategy, children: _jsxs("div", { id: "canvas", ref: canvasRef, style: containerStyle, role: "list", "aria-dropeffect": "move", onDrop: onFileDrop, onDragOver: handleDragOver, onDragLeave: clearHighlight, onDragEnd: clearHighlight, className: cn("relative mx-auto flex flex-col gap-4 rounded border", dragOver && "ring-2 ring-primary"), children: [dropRect && (_jsx("div", { className: "pointer-events-none absolute z-50 rounded border-2 border-primary/50 bg-primary/10", style: {
                        left: dropRect.left,
                        top: dropRect.top,
                        width: dropRect.width,
                        height: dropRect.height,
                    } })), showGrid && _jsx(GridOverlay, { gridCols: gridCols }), _jsx(SnapLine, { x: snapPosition }), components.map((c, i) => (_jsxs(Fragment, { children: [insertIndex === i && (_jsx("div", { "data-placeholder": true, className: cn("h-4 w-full rounded border-2 border-dashed border-primary bg-primary/10", snapPosition !== null && "ring-2 ring-primary") })), _jsx(CanvasItem, { component: c, index: i, parentId: undefined, selectedId: selectedId, onSelectId: onSelectId, onRemove: () => dispatch({ type: "remove", id: c.id }), dispatch: dispatch, locale: locale, gridEnabled: showGrid, gridCols: gridCols, viewport: viewport, device: device })] }, c.id))), insertIndex === components.length && (_jsx("div", { "data-placeholder": true, className: cn("h-4 w-full rounded border-2 border-dashed border-primary bg-primary/10", snapPosition !== null && "ring-2 ring-primary") }))] }) }));
};
export default PageCanvas;
