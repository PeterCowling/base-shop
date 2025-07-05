// packages/ui/components/molecules/Image360Viewer.tsx
"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/cn";
import { ZoomImage } from "../atoms/ZoomImage";
/* ------------------------------------------------------------------ *
 *  Component
 * ------------------------------------------------------------------ */
export const Image360Viewer = React.forwardRef(({ frames, alt, className, ...props }, ref) => {
    const [index, setIndex] = React.useState(0);
    const startX = React.useRef(null);
    /* ------------------------------------------------------------------ *
     *  Pointer handlers
     * ------------------------------------------------------------------ */
    const onPointerDown = (e) => {
        startX.current = e.clientX;
    };
    const onPointerMove = (e) => {
        if (startX.current === null)
            return;
        const dx = e.clientX - startX.current;
        if (Math.abs(dx) > 10) {
            setIndex((prev) => (prev + (dx > 0 ? -1 : 1) + frames.length) % frames.length);
            startX.current = e.clientX;
        }
    };
    const onPointerUp = () => {
        startX.current = null;
    };
    /* ------------------------------------------------------------------ *
     *  Render
     * ------------------------------------------------------------------ */
    return (_jsx("div", { ref: ref, onPointerDown: onPointerDown, onPointerMove: onPointerMove, onPointerUp: onPointerUp, onPointerLeave: onPointerUp, className: cn("touch-none", className), ...props, children: _jsx(ZoomImage, { src: frames[index], alt: alt ?? "", fill: true, className: "rounded-lg object-cover" }) }));
});
Image360Viewer.displayName = "Image360Viewer";
