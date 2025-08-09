"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { locales } from "@/i18n/locales";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, } from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates, } from "@dnd-kit/sortable";
import { memo, useCallback, useEffect, useMemo, useReducer, useState, } from "react";
import { ulid } from "ulid";
import { z } from "zod";
import { pageComponentSchema } from "@types";
import { Button } from "../atoms/shadcn";
import CanvasItem from "./page-builder/CanvasItem";
import ComponentEditor from "./page-builder/ComponentEditor";
import Palette from "./page-builder/Palette";
/* ════════════════ component catalogue ════════════════ */
const COMPONENT_TYPES = [
    "HeroBanner",
    "ValueProps",
    "ReviewsCarousel",
    "ProductGrid",
    "Gallery",
    "ContactForm",
    "ContactFormWithMap",
    "BlogListing",
    "Testimonials",
    "TestimonialSlider",
    "Image",
"Text",
];
/* ════════════════ runtime validation (Zod) ════════════════ */
/**
 *  Build → default → cast; the cast is safe because the default value
 *  fully satisfies the `HistoryState` contract.
 */
export const historyStateSchema = z
    .object({
    past: z.array(z.array(pageComponentSchema)),
    present: z.array(pageComponentSchema),
    future: z.array(z.array(pageComponentSchema)),
})
    .default({
    past: [],
    present: [],
    future: [],
});
function componentsReducer(state, action) {
    switch (action.type) {
        case "add":
            return [...state, action.component];
        case "move":
            return action.from === action.to
                ? state
                : arrayMove(state, action.from, action.to);
        case "remove":
            return state.filter((b) => b.id !== action.id);
        case "update":
            return state.map((b) => b.id === action.id ? { ...b, ...action.patch } : b);
        case "resize":
            return state.map((b) => b.id === action.id
                ? {
                    ...b,
                    width: action.width,
                    height: action.height,
                    left: action.left,
                    top: action.top,
                }
                : b);
        case "set":
            return action.components;
        default:
            return state;
    }
}
function reducer(state, action) {
    switch (action.type) {
        case "undo": {
            const previous = state.past.at(-1);
            if (!previous)
                return state;
            return {
                past: state.past.slice(0, -1),
                present: previous,
                future: [state.present, ...state.future],
            };
        }
        case "redo": {
            const next = state.future[0];
            if (!next)
                return state;
            return {
                past: [...state.past, state.present],
                present: next,
                future: state.future.slice(1),
            };
        }
        default: {
            const next = componentsReducer(state.present, action);
            if (next === state.present)
                return state;
            return {
                past: [...state.past, state.present],
                present: next,
                future: [],
            };
        }
    }
}
// Placeholder constant for reducer tests to strip component code
const palette = {};
/* ════════════════ component ════════════════ */
const PageBuilder = memo(function PageBuilder({ page, onSave, onPublish, onChange, style, }) {
    /* ── state initialise / persistence ───────────────────────────── */
    const storageKey = `page-builder-history-${page.id}`;
    const [state, dispatch] = useReducer(reducer, undefined, () => {
        if (typeof window === "undefined") {
            return {
                past: [],
                present: page.components,
                future: [],
            };
        }
        try {
            const stored = localStorage.getItem(storageKey);
            if (!stored)
                throw new Error("no stored state");
            return historyStateSchema.parse(JSON.parse(stored));
        }
        catch {
            return {
                past: [],
                present: page.components,
                future: [],
            };
        }
    });
    const components = state.present;
    const [selectedId, setSelectedId] = useState(null);
    const [viewport, setViewport] = useState("desktop");
    const [locale, setLocale] = useState("en");
    /* ── derived memo values ──────────────────────────────────────── */
    const widthMap = useMemo(() => ({
        desktop: "100%",
        tablet: "768px",
        mobile: "375px",
    }), []);
    const containerStyle = useMemo(() => ({ width: widthMap[viewport] }), [viewport, widthMap]);
    /* ── side-effects ─────────────────────────────────────────────── */
    useEffect(() => {
        onChange?.(components);
        if (typeof window !== "undefined") {
            localStorage.setItem(storageKey, JSON.stringify(state));
        }
    }, [components, onChange, state, storageKey]);
    useEffect(() => {
        const handler = (e) => {
            if (!(e.ctrlKey || e.metaKey))
                return;
            const k = e.key.toLowerCase();
            if (k === "z") {
                e.preventDefault();
                dispatch({ type: "undo" });
            }
            else if (k === "y") {
                e.preventDefault();
                dispatch({ type: "redo" });
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);
    /* ── dnd sensors / handler ────────────────────────────────────── */
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
    const handleDragEnd = useCallback((ev) => {
        const { active, over } = ev;
        if (!over)
            return;
        const a = active.data.current;
        const o = over.data.current;
        if (a?.from === "palette" && over.id === "canvas") {
            dispatch({
                type: "add",
                component: {
                    id: ulid(),
                    type: a.type,
                },
            });
        }
        else if (a?.from === "canvas" && o?.from === "canvas") {
            dispatch({ type: "move", from: a.index, to: o.index });
        }
    }, [dispatch]);
    /* ── form-data builder ────────────────────────────────────────── */
    const formData = useMemo(() => {
        const fd = new FormData();
        fd.append("id", page.id);
        fd.append("updatedAt", page.updatedAt);
        fd.append("slug", page.slug);
        fd.append("status", page.status);
        fd.append("title", JSON.stringify(page.seo.title));
        fd.append("description", JSON.stringify(page.seo.description ?? {}));
        fd.append("components", JSON.stringify(components));
        return fd;
    }, [page, components]);
    /* ── render ───────────────────────────────────────────────────── */
    return (_jsxs("div", { className: "flex gap-4", style: style, children: [_jsx("aside", { className: "w-48 shrink-0", children: _jsx(Palette, {}) }), _jsxs("div", { className: "flex flex-1 flex-col gap-4", children: [_jsx("div", { className: "flex justify-end gap-2", children: ["desktop", "tablet", "mobile"].map((v) => (_jsx(Button, { variant: viewport === v ? "default" : "outline", onClick: () => setViewport(v), children: v.charAt(0).toUpperCase() + v.slice(1) }, v))) }), _jsx("div", { className: "flex justify-end gap-2", children: locales.map((l) => (_jsx(Button, { variant: locale === l ? "default" : "outline", onClick: () => setLocale(l), children: l.toUpperCase() }, l))) }), _jsx(DndContext, { sensors: sensors, collisionDetection: closestCenter, onDragEnd: handleDragEnd, children: _jsx(SortableContext, { items: components.map((c) => c.id), strategy: rectSortingStrategy, children: _jsx("div", { id: "canvas", style: containerStyle, className: "mx-auto flex flex-col gap-4 rounded border", children: components.map((c, i) => (_jsx(CanvasItem, { component: c, index: i, locale: locale, selected: c.id === selectedId, onSelect: () => setSelectedId(c.id), onRemove: () => dispatch({ type: "remove", id: c.id }), dispatch: dispatch }, c.id))) }) }) }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { onClick: () => dispatch({ type: "undo" }), disabled: !state.past.length, children: "Undo" }), _jsx(Button, { onClick: () => dispatch({ type: "redo" }), disabled: !state.future.length, children: "Redo" }), _jsx(Button, { onClick: () => onSave(formData), children: "Save" }), _jsx(Button, { variant: "outline", onClick: () => onPublish(formData), children: "Publish" })] })] }), selectedId && (_jsx("aside", { className: "w-72 shrink-0", children: _jsx(ComponentEditor, { component: components.find((c) => c.id === selectedId), onChange: (patch) => dispatch({ type: "update", id: selectedId, patch }) }) }))] }));
});
export default PageBuilder;
