"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function ContactForm({ action = "#", method = "post", }) {
    return (_jsxs("form", { className: "space-y-2", action: action, method: method, children: [_jsx("input", { type: "text", name: "name", placeholder: "Name", className: "w-full rounded border p-2" }), _jsx("input", { type: "email", name: "email", placeholder: "Email", className: "w-full rounded border p-2" }), _jsx("textarea", { name: "message", placeholder: "Message", className: "w-full rounded border p-2" }), _jsx("button", { type: "submit", className: "rounded bg-primary px-4 py-2 text-primary-fg", children: "Submit" })] }));
}
