"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { memo } from "react";
import { atomRegistry, moleculeRegistry, organismRegistry } from "../blocks";
const palette = {
    atoms: Object.keys(atomRegistry).map((t) => ({
        type: t,
        label: t.replace(/([A-Z])/g, " $1").trim(),
    })),
    molecules: Object.keys(moleculeRegistry).map((t) => ({
        type: t,
        label: t.replace(/([A-Z])/g, " $1").trim(),
    })),
    organisms: Object.keys(organismRegistry).map((t) => ({
        type: t,
        label: t.replace(/([A-Z])/g, " $1").trim(),
    })),
};
const PaletteItem = memo(function PaletteItem({ type, }) {
    const { attributes, listeners, setNodeRef, transform } = useSortable({
        id: type,
        data: { from: "palette", type },
    });
    return (_jsx("div", { ref: setNodeRef, ...attributes, ...listeners, style: { transform: CSS.Transform.toString(transform) }, className: "cursor-grab rounded border p-2 text-center text-sm", children: type }));
});
const Palette = memo(function Palette() {
    return (_jsx("div", { className: "flex flex-col gap-4", children: Object.entries(palette).map(([category, items]) => (_jsxs("div", { className: "space-y-2", children: [_jsx("h4", { className: "font-semibold capitalize", children: category }), _jsx("div", { className: "flex flex-col gap-2", children: items.map((p) => (_jsx(PaletteItem, { type: p.type }, p.type))) })] }, category))) }));
});
export default Palette;
