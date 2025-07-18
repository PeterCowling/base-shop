"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "../ui/table";
export function DataTable({ rows, columns, selectable = false, onSelectionChange, }) {
    const [selected, setSelected] = useState(new Set());
    const toggle = (idx) => {
        const next = new Set(selected);
        if (next.has(idx)) {
            next.delete(idx);
        }
        else {
            next.add(idx);
        }
        setSelected(next);
        onSelectionChange?.(Array.from(next).map((i) => rows[i]));
    };
    return (_jsx("div", { className: "overflow-x-auto", children: _jsxs(Table, { className: "min-w-full", children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [selectable && _jsx(TableHead, { className: "w-4" }), columns.map((col) => (_jsx(TableHead, { style: { width: col.width }, children: col.header }, col.header)))] }) }), _jsx(TableBody, { children: rows.map((row, i) => (_jsxs(TableRow, { "data-state": selected.has(i) ? "selected" : undefined, onClick: selectable ? () => toggle(i) : undefined, className: selectable ? "cursor-pointer" : undefined, children: [selectable && (_jsx(TableCell, { className: "w-4", children: _jsx("input", { type: "checkbox", className: "accent-primary size-4", checked: selected.has(i), onChange: () => toggle(i), onClick: (e) => e.stopPropagation() }) })), columns.map((col) => (_jsx(TableCell, { children: col.render(row) }, col.header)))] }, i))) })] }) }));
}
