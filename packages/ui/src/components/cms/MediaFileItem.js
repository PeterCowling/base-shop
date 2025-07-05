// packages/ui/components/cms/MediaFileItem.tsx
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Image from "next/image";
export default function MediaFileItem({ item, onDelete }) {
    return (_jsxs("div", { className: "relative h-32 w-full overflow-hidden rounded-md border", children: [_jsx("button", { onClick: () => onDelete(item.url), className: "absolute top-1 right-1 rounded bg-black/50 px-1.5 text-xs text-white", children: "Delete" }), _jsx(Image, { src: item.url, alt: item.altText || "media", fill: true, className: "object-cover" }), item.altText && (_jsx("p", { className: "absolute bottom-1 left-1 bg-black/50 px-1 text-xs text-white", children: item.altText }))] }));
}
