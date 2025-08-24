"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import ComponentEditor from "./ComponentEditor";
import { useCallback } from "react";
import { Button } from "../../atoms/shadcn";
const PageSidebar = ({ components, selectedId, dispatch }) => {
    const handleChange = useCallback((patch) => selectedId && dispatch({ type: "update", id: selectedId, patch }), [dispatch, selectedId]);
    const handleResize = useCallback((size) => selectedId && dispatch({ type: "resize", id: selectedId, ...size }), [dispatch, selectedId]);
    const handleDuplicate = useCallback(() => {
        selectedId && dispatch({ type: "duplicate", id: selectedId });
    }, [dispatch, selectedId]);
    if (!selectedId) {
        return (_jsx("aside", { className: "w-72 shrink-0 p-4 text-sm text-muted-foreground", "data-tour": "sidebar", children: "Select a component to edit its properties." }));
    }
    return (_jsxs("aside", { className: "w-72 shrink-0 space-y-2", "data-tour": "sidebar", children: [_jsx(Button, { type: "button", variant: "outline", onClick: handleDuplicate, children: "Duplicate" }), _jsx(ComponentEditor, { component: components.find((c) => c.id === selectedId), onChange: handleChange, onResize: handleResize })] }));
};
export default PageSidebar;
