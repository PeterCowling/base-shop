import { jsx as _jsx } from "react/jsx-runtime";
// src/components/Avatar.tsx
import Image from "next/image";
import * as React from "react";
import { boxProps } from "../../utils/boxProps";
import { cn } from "../../utils/cn";
// ────────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────────
export const Avatar = React.forwardRef(({ className, src, alt = "", fallback, size = 32, width, height, padding, margin, ...props }, ref) => {
    const dimension = size;
    // Ensure we hand Next <Image> genuine numbers
    const numericWidth = typeof width === "number"
        ? width
        : width !== undefined
            ? parseInt(width, 10)
            : dimension;
    const numericHeight = typeof height === "number"
        ? height
        : height !== undefined
            ? parseInt(height, 10)
            : dimension;
    const { classes, style } = boxProps({
        width: width ?? dimension, // visual size (can be any CSS unit)
        height: height ?? dimension, // visual size (can be any CSS unit)
        padding,
        margin,
    });
    // ─── No src: render fallback ────────────────────────────────────────────
    if (!src) {
        return (_jsx("div", { ref: ref, style: style, className: cn("bg-muted flex items-center justify-center rounded-full text-sm", classes, className), children: fallback ?? (typeof alt === "string" ? alt.charAt(0) : null) }));
    }
    // ─── With src: render Next <Image> ──────────────────────────────────────
    return (_jsx(Image, { ref: ref, src: src, alt: alt, width: numericWidth, height: numericHeight, style: style, className: cn("rounded-full object-cover", classes, className), ...props }));
});
Avatar.displayName = "Avatar";
