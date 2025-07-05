// packages/ui/components/organisms/ProductGallery.tsx
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/cn";
import { ARViewer } from "../atoms/ARViewer";
import { VideoPlayer } from "../atoms/VideoPlayer";
import { ZoomImage } from "../atoms/ZoomImage";
import { Image360Viewer } from "../molecules/Image360Viewer";
import { MediaSelector } from "../molecules/MediaSelector";
/* ------------------------------------------------------------------ *
 *  Component
 * ------------------------------------------------------------------ */
export function ProductGallery({ media, className, ...props }) {
    const [index, setIndex] = React.useState(0);
    const item = media[index];
    /* ------------------------------------------------------------------ *
     *  Determine which viewer to render
     * ------------------------------------------------------------------ */
    let content = null;
    if (!item) {
        content = null;
    }
    else if (item.type === "image") {
        content = (_jsx(ZoomImage, { src: item.src, alt: item.alt ?? "", fill: true, className: "rounded-lg object-cover" }));
    }
    else if (item.type === "video") {
        content = _jsx(VideoPlayer, { src: item.src, className: "h-full w-full" });
    }
    else if (item.type === "360") {
        content = (_jsx(Image360Viewer, { frames: item.frames ?? [item.src], alt: item.alt ?? "", className: "h-full w-full" }));
    }
    else if (item.type === "model") {
        content = _jsx(ARViewer, { src: item.src, className: "h-full w-full" });
    }
    /* ------------------------------------------------------------------ *
     *  Render
     * ------------------------------------------------------------------ */
    return (_jsxs("div", { className: cn("space-y-2", className), ...props, children: [_jsx("div", { className: "relative aspect-square w-full", children: content }), media.length > 1 && (_jsx(MediaSelector, { items: media, active: index, onChange: setIndex }))] }));
}
