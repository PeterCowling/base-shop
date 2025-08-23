"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NewsletterForm } from "./molecules";
export default function NewsletterSignup({ action, placeholder = "Email", submitLabel = "Subscribe", text, }) {
    return (_jsxs("div", { className: "space-y-2", children: [text && _jsx("p", { "data-token": "--color-fg", children: text }), _jsx(NewsletterForm, { action: action, placeholder: placeholder, submitLabel: submitLabel })] }));
}
