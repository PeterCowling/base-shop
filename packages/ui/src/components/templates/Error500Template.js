import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
import { Button } from "../atoms/shadcn";
export function Error500Template({ homeHref = "/", className, ...props }) {
    return (_jsxs("div", { className: cn("flex flex-col items-center justify-center space-y-4 py-20 text-center", className), ...props, children: [_jsx("h1", { className: "text-6xl font-bold", children: "500" }), _jsx("p", { className: "text-lg", children: "Something went wrong" }), _jsx(Button, { onClick: () => (window.location.href = homeHref), children: "Go home" })] }));
}
