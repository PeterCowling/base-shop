import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
/**
 * Collapsible list of questions and answers.
 */
export function QAModule({ items, className, ...props }) {
    return (_jsx("div", { className: cn("space-y-4", className), ...props, children: items.map((qa, i) => (_jsxs("details", { className: "group rounded-md border p-4", children: [_jsx("summary", { className: "cursor-pointer font-medium group-open:mb-2", children: qa.question }), _jsx("div", { className: "text-sm text-muted", children: qa.answer })] }, i))) }));
}
