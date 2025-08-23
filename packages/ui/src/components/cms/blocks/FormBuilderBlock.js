"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function FormBuilderBlock({ action = "#", method = "post", fields = [], submitLabel = "Submit", }) {
    return (_jsxs("form", { className: "space-y-2", action: action, method: method, children: [fields.map((field, idx) => {
                if (field.type === "select") {
                    return (_jsx("select", { name: field.name, className: "w-full rounded border p-2", children: field.options?.map((opt) => (_jsx("option", { value: opt.value, children: opt.label }, opt.value))) }, idx));
                }
                return (_jsx("input", { type: field.type, name: field.name, placeholder: field.label, className: "w-full rounded border p-2" }, idx));
            }), _jsx("button", { type: "submit", className: "rounded bg-primary px-4 py-2", "data-token": "--color-primary", children: _jsx("span", { className: "text-primary-fg", "data-token": "--color-primary-fg", children: submitLabel }) })] }));
}
