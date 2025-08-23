// packages/ui/src/components/cms/page-builder/panels/ContentPanel.tsx
"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Input } from "../../../atoms/shadcn";
import { Tooltip } from "../../../atoms";
import { Suspense } from "react";
import editorRegistry from "../editorRegistry";
export default function ContentPanel({ component, onChange, handleInput, }) {
    const Specific = editorRegistry[component.type];
    const comp = component;
    const nonNegative = (v) => (v !== undefined && v < 0 ? "Must be ≥ 0" : undefined);
    const minItemsError = nonNegative(comp.minItems) ||
        (comp.minItems !== undefined &&
            comp.maxItems !== undefined &&
            comp.minItems > comp.maxItems
            ? "Min Items cannot exceed Max Items"
            : undefined);
    const maxItemsError = nonNegative(comp.maxItems) ||
        (comp.minItems !== undefined &&
            comp.maxItems !== undefined &&
            comp.maxItems < comp.minItems
            ? "Max Items cannot be less than Min Items"
            : undefined);
    const desktopItemsError = nonNegative(comp.desktopItems);
    const tabletItemsError = nonNegative(comp.tabletItems);
    const mobileItemsError = nonNegative(comp.mobileItems);
    const columnsError = nonNegative(comp.columns) ||
        (comp.columns !== undefined &&
            ((comp.minItems !== undefined && comp.columns < comp.minItems) ||
                (comp.maxItems !== undefined && comp.columns > comp.maxItems))
            ? "Columns must be between min and max items"
            : undefined);
    return (_jsxs("div", { className: "space-y-2", children: [("minItems" in component || "maxItems" in component) && (_jsxs(_Fragment, { children: [_jsx(Input, { label: _jsxs("span", { className: "flex items-center gap-1", children: ["Min Items", _jsx(Tooltip, { text: "Minimum number of items", children: "?" })] }), type: "number", value: comp.minItems ?? "", onChange: (e) => {
                            const val = e.target.value === "" ? undefined : Number(e.target.value);
                            if (val === undefined) {
                                handleInput("minItems", undefined);
                                return;
                            }
                            const max = comp.maxItems;
                            const patch = { minItems: val };
                            if (max !== undefined && val > max) {
                                patch.maxItems = val;
                            }
                            onChange(patch);
                        }, min: 0, max: comp.maxItems ?? undefined, error: minItemsError }), _jsx(Input, { label: _jsxs("span", { className: "flex items-center gap-1", children: ["Max Items", _jsx(Tooltip, { text: "Maximum number of items", children: "?" })] }), type: "number", value: comp.maxItems ?? "", onChange: (e) => {
                            const val = e.target.value === "" ? undefined : Number(e.target.value);
                            if (val === undefined) {
                                handleInput("maxItems", undefined);
                                return;
                            }
                            const min = comp.minItems;
                            const patch = { maxItems: val };
                            if (min !== undefined && val < min) {
                                patch.minItems = val;
                            }
                            onChange(patch);
                        }, min: comp.minItems ?? 0, error: maxItemsError })] })), ("desktopItems" in component ||
                "tabletItems" in component ||
                "mobileItems" in component) && (_jsxs(_Fragment, { children: [_jsx(Input, { label: _jsxs("span", { className: "flex items-center gap-1", children: ["Desktop Items", _jsx(Tooltip, { text: "Items shown on desktop", children: "?" })] }), type: "number", value: comp.desktopItems ?? "", onChange: (e) => handleInput("desktopItems", e.target.value === "" ? undefined : Number(e.target.value)), min: 0, error: desktopItemsError }), _jsx(Input, { label: _jsxs("span", { className: "flex items-center gap-1", children: ["Tablet Items", _jsx(Tooltip, { text: "Items shown on tablet", children: "?" })] }), type: "number", value: comp.tabletItems ?? "", onChange: (e) => handleInput("tabletItems", e.target.value === "" ? undefined : Number(e.target.value)), min: 0, error: tabletItemsError }), _jsx(Input, { label: _jsxs("span", { className: "flex items-center gap-1", children: ["Mobile Items", _jsx(Tooltip, { text: "Items shown on mobile", children: "?" })] }), type: "number", value: comp.mobileItems ?? "", onChange: (e) => handleInput("mobileItems", e.target.value === "" ? undefined : Number(e.target.value)), min: 0, error: mobileItemsError })] })), "columns" in component && (_jsx(Input, { label: _jsxs("span", { className: "flex items-center gap-1", children: ["Columns", _jsx(Tooltip, { text: "Number of columns", children: "?" })] }), type: "number", value: comp.columns ?? "", onChange: (e) => handleInput("columns", e.target.value === "" ? undefined : Number(e.target.value)), min: comp.minItems, max: comp.maxItems, error: columnsError })), _jsx(Suspense, { fallback: _jsx("p", { className: "text-muted text-sm", children: "Loading..." }), children: Specific ? (_jsx(Specific, { component: component, onChange: onChange })) : (_jsx("p", { className: "text-muted text-sm", children: "No editable props" })) })] }));
}
