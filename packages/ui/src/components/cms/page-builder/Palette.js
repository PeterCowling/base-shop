"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo, useState, useCallback, useEffect } from "react";
import { atomRegistry, moleculeRegistry, organismRegistry, containerRegistry, layoutRegistry, overlayRegistry, } from "../blocks";
import { Popover, PopoverContent, PopoverTrigger, } from "../../atoms";
const defaultIcon = "/window.svg";
const createPaletteItems = (registry) => Object.keys(registry)
    .sort()
    .map((t) => ({
    type: t,
    label: t.replace(/([A-Z])/g, " $1").trim(),
    icon: registry[t]?.previewImage ?? defaultIcon,
    description: registry[t]?.description,
    previewImage: registry[t]?.previewImage ?? defaultIcon,
}));
const palette = {
    layout: createPaletteItems(layoutRegistry),
    containers: createPaletteItems(containerRegistry),
    atoms: createPaletteItems(atomRegistry),
    molecules: createPaletteItems(moleculeRegistry),
    organisms: createPaletteItems(organismRegistry),
    overlays: createPaletteItems(overlayRegistry),
};
const PaletteItem = memo(function PaletteItem({ type, label, icon, description, previewImage, onAdd, }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
        id: type,
        data: { from: "palette", type },
    });
    const [open, setOpen] = useState(false);
    const handleKeyDown = useCallback((e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onAdd(type, label);
        }
    }, [onAdd, type, label]);
    const content = (_jsxs("div", { ref: setNodeRef, ...attributes, ...listeners, role: "button", tabIndex: 0, "aria-grabbed": isDragging, title: "Drag or press space/enter to add", style: { transform: CSS.Transform.toString(transform) }, className: "flex cursor-grab items-center gap-2 rounded border p-2 text-sm", onMouseEnter: () => setOpen(true), onMouseLeave: () => setOpen(false), onFocus: () => setOpen(true), onBlur: () => setOpen(false), onKeyDown: handleKeyDown, children: [_jsx("img", { src: icon, alt: "", "aria-hidden": "true", className: "h-6 w-6 rounded", loading: "lazy" }), _jsx("span", { children: label })] }));
    return (_jsxs(Popover, { open: open, onOpenChange: setOpen, children: [_jsx(PopoverTrigger, { asChild: true, children: content }), _jsxs(PopoverContent, { className: "w-64 space-y-2 text-sm", children: [_jsx("img", { src: previewImage, alt: "", className: "w-full rounded", loading: "lazy" }), description && _jsx("p", { children: description })] })] }));
});
const Palette = memo(function Palette({ onAdd }) {
    const [search, setSearch] = useState("");
    const [liveMessage, setLiveMessage] = useState("");
    const handleAdd = useCallback((type, label) => {
        onAdd(type);
        setLiveMessage(`${label} added`);
    }, [onAdd]);
    useEffect(() => {
        if (!liveMessage)
            return;
        const t = setTimeout(() => setLiveMessage(""), 500);
        return () => clearTimeout(t);
    }, [liveMessage]);
    return (_jsxs("div", { className: "flex flex-col gap-4", "data-tour": "drag-component", children: [_jsx("input", { type: "text", value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Search components...", "aria-label": "Search components", className: "rounded border p-2 text-sm" }), _jsx("div", { "aria-live": "polite", className: "sr-only", children: liveMessage }), Object.entries(palette).map(([category, items]) => {
                const filtered = items.filter((p) => p.label.toLowerCase().includes(search.toLowerCase()));
                if (!filtered.length)
                    return null;
                return (_jsxs("div", { className: "space-y-2", children: [_jsx("h4", { className: "font-semibold capitalize", children: category }), _jsx("div", { className: "flex flex-col gap-2", children: filtered.map((p) => (_jsx(PaletteItem, { type: p.type, label: p.label, icon: p.icon, description: p.description, previewImage: p.previewImage, onAdd: handleAdd }, p.type))) })] }, category));
            })] }));
});
export default Palette;
