// packages/ui/src/components/cms/style/Tokens.tsx
"use client";
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Input } from "../../atoms/shadcn";
import { useTokenEditor, } from "../../../hooks/useTokenEditor";
import { ColorInput, FontSelect, RangeInput, getContrast, suggestContrastColor, } from "../index";
import { useEffect, useRef, useState, useMemo, ReactElement, } from "react";
export default function Tokens({ tokens, baseTokens, onChange, focusToken, }) {
    const { colors, fonts, others, sansFonts, monoFonts, googleFonts, newFont, setNewFont, setToken, handleUpload, addCustomFont, setGoogleFont, } = useTokenEditor(tokens, baseTokens, onChange);
    const containerRef = useRef(null);
    const [search, setSearch] = useState("");
    const groups = useMemo(() => {
        const all = [...colors, ...fonts, ...others];
        const g = {};
        all.forEach((info) => {
            const prefix = info.key.slice(2).split("-")[0];
            (g[prefix] ??= []).push(info);
        });
        return g;
    }, [colors, fonts, others]);
    const [openGroups, setOpenGroups] = useState(() => {
        if (typeof window !== "undefined") {
            try {
                const stored = localStorage.getItem("token-group-state");
                if (stored)
                    return JSON.parse(stored);
            }
            catch {
                // ignore
            }
        }
        const initial = {};
        Object.keys(groups).forEach((k) => {
            initial[k] = true;
        });
        return initial;
    });
    useEffect(() => {
        setOpenGroups((prev) => {
            const updated = { ...prev };
            let changed = false;
            Object.keys(groups).forEach((k) => {
                if (updated[k] === undefined) {
                    updated[k] = true;
                    changed = true;
                }
            });
            return changed ? updated : prev;
        });
    }, [groups]);
    useEffect(() => {
        try {
            localStorage.setItem("token-group-state", JSON.stringify(openGroups));
        }
        catch {
            // ignore
        }
    }, [openGroups]);
    useEffect(() => {
        if (!focusToken)
            return;
        const el = containerRef.current?.querySelector(`[data-token-key="${focusToken}"]`);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("ring-2", "ring-info");
            el.dataset.token = "--color-info";
            const input = el.querySelector("input, select, textarea, button");
            input?.focus();
            const t = setTimeout(() => {
                el.classList.remove("ring-2", "ring-info");
                delete el.dataset.token;
            }, 2000);
            return () => clearTimeout(t);
        }
    }, [focusToken]);
    const toggleGroup = (key) => {
        setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
    };
    const renderInput = ({ key: k, value: v, defaultValue, isOverridden, }) => {
        if (k.startsWith("--color")) {
            let warning = null;
            let pairKey = "";
            if (k.startsWith("--color-bg")) {
                pairKey = `--color-fg${k.slice("--color-bg".length)}`;
            }
            else if (k.startsWith("--color-fg")) {
                pairKey = `--color-bg${k.slice("--color-fg".length)}`;
            }
            else if (k.endsWith("-fg")) {
                pairKey = k.slice(0, -3);
            }
            else {
                const candidate = `${k}-fg`;
                if (tokens[candidate] !== undefined ||
                    baseTokens[candidate] !== undefined) {
                    pairKey = candidate;
                }
            }
            const pairVal = pairKey
                ? tokens[pairKey] ?? baseTokens[pairKey]
                : undefined;
            if (pairVal) {
                const contrast = getContrast(v, pairVal);
                if (contrast < 4.5) {
                    const suggestion = suggestContrastColor(v, pairVal);
                    warning = (_jsxs("span", { className: "text-xs text-danger", "data-token": "--color-danger", children: ["Low contrast (", contrast.toFixed(2), ":1)", suggestion ? ` – try ${suggestion}` : ""] }));
                }
            }
            return (_jsxs("label", { "data-token-key": k, className: `flex flex-col gap-1 text-sm ${isOverridden ? "border-l-2 border-l-info pl-2" : ""}`, "data-token": isOverridden ? "--color-info" : undefined, children: [_jsxs("span", { className: "flex items-center gap-2", children: [_jsx("span", { className: "w-40 flex-shrink-0", children: k }), _jsx(ColorInput, { value: v, onChange: (val) => setToken(k, val) }), isOverridden && (_jsx("button", { type: "button", className: "rounded border px-2 py-1 text-xs", onClick: () => setToken(k, defaultValue ?? ""), children: "Reset" }))] }), defaultValue && (_jsxs("span", { className: "text-xs text-muted-foreground", children: ["Default: ", defaultValue] })), warning] }, k));
        }
        if (k.startsWith("--font")) {
            const options = k.includes("mono") ? monoFonts : sansFonts;
            const type = k.includes("mono") ? "mono" : "sans";
            return (_jsxs("label", { "data-token-key": k, className: `flex flex-col gap-1 text-sm ${isOverridden ? "border-l-2 border-l-info pl-2" : ""}`, "data-token": isOverridden ? "--color-info" : undefined, children: [_jsxs("span", { className: "flex items-center gap-2", children: [_jsx("span", { className: "w-40 flex-shrink-0", children: k }), _jsx(FontSelect, { value: v, options: options, onChange: (val) => setToken(k, val), onUpload: (e) => handleUpload(type, e) }), isOverridden && (_jsx("button", { type: "button", className: "rounded border px-2 py-1 text-xs", onClick: () => setToken(k, defaultValue ?? ""), children: "Reset" })), _jsxs("select", { className: "rounded border p-1", onChange: (e) => {
                                    if (e.target.value) {
                                        setGoogleFont(type, e.target.value);
                                        e.target.value = "";
                                    }
                                }, children: [_jsx("option", { value: "", children: "Google Fonts" }), googleFonts.map((f) => (_jsx("option", { value: f, style: { fontFamily: f }, children: f }, f)))] })] }), defaultValue && (_jsxs("span", { className: "text-xs text-muted-foreground", children: ["Default: ", defaultValue] }))] }, k));
        }
        if (/px$/.test(v)) {
            return (_jsxs("label", { "data-token-key": k, className: `flex items-center gap-2 text-sm ${isOverridden ? "border-l-2 border-l-info pl-2" : ""}`, "data-token": isOverridden ? "--color-info" : undefined, children: [_jsx("span", { className: "w-40 flex-shrink-0", children: k }), _jsx(RangeInput, { value: v, onChange: (val) => setToken(k, val) }), isOverridden && (_jsx("button", { type: "button", className: "rounded border px-2 py-1 text-xs", onClick: () => setToken(k, defaultValue ?? ""), children: "Reset" })), defaultValue && (_jsxs("span", { className: "text-xs text-muted-foreground", children: ["Default: ", defaultValue] }))] }, k));
        }
        return (_jsxs("label", { "data-token-key": k, className: `flex items-center gap-2 text-sm ${isOverridden ? "border-l-2 border-l-info pl-2" : ""}`, "data-token": isOverridden ? "--color-info" : undefined, children: [_jsx("span", { className: "w-40 flex-shrink-0", children: k }), _jsx(Input, { value: v, onChange: (e) => setToken(k, e.target.value) }), isOverridden && (_jsx("button", { type: "button", className: "rounded border px-2 py-1 text-xs", onClick: () => setToken(k, defaultValue ?? ""), children: "Reset" })), defaultValue && (_jsxs("span", { className: "text-xs text-muted-foreground", children: ["Default: ", defaultValue] }))] }, k));
    };
    const filteredGroups = useMemo(() => {
        const lower = search.toLowerCase();
        const f = {};
        Object.entries(groups).forEach(([prefix, list]) => {
            const filtered = list.filter((t) => t.key.toLowerCase().includes(lower));
            if (filtered.length > 0)
                f[prefix] = filtered;
        });
        return f;
    }, [groups, search]);
    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    return (_jsxs("div", { ref: containerRef, className: "max-h-64 space-y-4 overflow-y-auto rounded border p-2", children: [_jsx(Input, { placeholder: "Search tokens", value: search, onChange: (e) => setSearch(e.target.value), className: "mb-2" }), Object.entries(filteredGroups).map(([prefix, list]) => (_jsxs("div", { className: "space-y-2", children: [_jsxs("button", { type: "button", className: "flex w-full items-center justify-between font-medium", onClick: () => toggleGroup(prefix), children: [_jsx("span", { children: capitalize(prefix) }), _jsx("span", { children: openGroups[prefix] ? "−" : "+" })] }), openGroups[prefix] && (_jsxs("div", { className: "space-y-2", children: [list.map((t) => renderInput(t)), prefix === "font" && (_jsxs("div", { className: "flex items-center gap-2 pt-2", children: [_jsx(Input, { placeholder: "Add font stack", value: newFont, onChange: (e) => setNewFont(e.target.value) }), _jsx("button", { type: "button", className: "rounded border px-2 py-1", onClick: addCustomFont, children: "Add" })] }))] }))] }, prefix)))] }));
}
