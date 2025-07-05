// packages/ui/components/cms/ProductFilters.tsx  (unchanged except export)
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Input } from "@/components/atoms-shadcn";
export const statuses = ["all", "active", "draft", "archived"];
export default function ProductFilters({ search, status, onSearchChange, onStatusChange, }) {
    return (_jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsx(Input, { type: "search", placeholder: "Search titles or SKU\u2026", className: "w-64", value: search, onChange: (e) => onSearchChange(e.target.value) }), _jsx("select", { className: "rounded-md border px-3 py-2 text-sm", value: status, onChange: (e) => onStatusChange(e.target.value), children: statuses.map((s) => (_jsx("option", { value: s, children: s === "all" ? "All statuses" : s }, s))) })] }));
}
