"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from "../../../../utils/style";
export default function MultiColumn({ children, columns = 2, gap = "1rem", className, }) {
    return (_jsx("div", { className: cn("grid", className), style: {
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gap,
        }, children: children }));
}
