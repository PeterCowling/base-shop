import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
import { Button } from "../atoms";
export function PaginationControl({ page, pageCount, onPageChange, className, ...props }) {
    const maxButtons = 5;
    const start = Math.max(1, Math.min(page - 2, pageCount - maxButtons + 1));
    const end = Math.min(pageCount, start + maxButtons - 1);
    const pages = [];
    for (let i = start; i <= end; i++)
        pages.push(i);
    const change = (p) => {
        if (p >= 1 && p <= pageCount)
            onPageChange?.(p);
    };
    return (_jsxs("div", { className: cn("flex items-center gap-2", className), ...props, children: [_jsx(Button, { variant: "outline", onClick: () => change(page - 1), disabled: page === 1, children: "Prev" }), pages.map((p) => (_jsx(Button, { variant: p === page ? "default" : "outline", onClick: () => change(p), children: p }, p))), _jsx(Button, { variant: "outline", onClick: () => change(page + 1), disabled: page === pageCount, children: "Next" })] }));
}
PaginationControl.displayName = "PaginationControl";
