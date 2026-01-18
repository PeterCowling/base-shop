"use strict";
// src/components/pdp/ImageGallery.tsx
"use client";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ImageGallery;
const jsx_runtime_1 = require("react/jsx-runtime");
const image_1 = __importDefault(require("next/image"));
const react_1 = require("react");
function ImageGallery({ items }) {
    const [index, setIndex] = (0, react_1.useState)(0);
    const [zoom, setZoom] = (0, react_1.useState)(false);
    const item = items[index];
    if (!item)
        return null;
    // Tailwind utility tokens used in template classes
    const zoomOut = "cursor-zoom-out"; // i18n-exempt -- ABC-123 CSS utility token
    const zoomIn = "cursor-zoom-in"; // i18n-exempt -- ABC-123 CSS utility token
    const selectedRing = " ring-2 ring-black"; // i18n-exempt -- ABC-123 CSS utility token
    const responsiveSizes = "(min-width: 1024px) 50vw, 100vw"; // i18n-exempt -- ABC-123 responsive sizes attribute value
    return ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)("figure", { className: `relative w-full aspect-square overflow-hidden ${zoom ? zoomOut : zoomIn}`, onClick: () => setZoom((z) => !z), children: item.type === "image" ? ((0, jsx_runtime_1.jsx)(image_1.default, { src: item.url, alt: item.altText ?? "", fill: true, sizes: responsiveSizes, className: `object-cover rounded-lg transition-transform ${zoom ? "scale-125" : ""}`, priority: true })) : ((0, jsx_runtime_1.jsx)("video", { src: item.url, controls: true, className: "h-full w-full rounded-lg object-cover", "data-aspect": "1/1" })) }), items.length > 1 && ((0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: (0, jsx_runtime_1.jsx)("div", { className: "inline-flex gap-2", children: items.map((m, i) => ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => {
                            setIndex(i);
                            setZoom(false);
                        }, className: `relative h-16 w-16 overflow-hidden rounded border${i === index ? selectedRing : ""}`, children: m.type === "image" ? ((0, jsx_runtime_1.jsx)(image_1.default, { src: m.url, alt: m.altText ?? "", fill: true, className: "object-cover" })) : ((0, jsx_runtime_1.jsx)("span", { className: "inline-flex h-full w-full items-center justify-center text-xs", children: "Video" })) }, m.url))) }) }))] }));
}
