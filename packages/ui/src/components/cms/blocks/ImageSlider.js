"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
export default function ImageSlider({ slides = [], minItems, maxItems, }) {
    const list = slides.slice(0, maxItems ?? slides.length);
    const [index, setIndex] = useState(0);
    if (!list.length || list.length < (minItems ?? 0))
        return null;
    const next = () => setIndex((i) => (i + 1) % list.length);
    const prev = () => setIndex((i) => (i - 1 + list.length) % list.length);
    const handleKey = (e) => {
        if (e.key === "ArrowRight")
            next();
        else if (e.key === "ArrowLeft")
            prev();
    };
    return (_jsxs("div", { className: "relative", role: "region", "aria-roledescription": "carousel", "aria-label": "Image Slider", tabIndex: 0, onKeyDown: handleKey, children: [list.map((img, i) => (_jsxs("figure", { className: i === index ? "block" : "hidden", "aria-hidden": i !== index, children: [_jsx("img", { src: img.src, alt: img.alt ?? "", className: "w-full object-cover" }), img.caption && (_jsx("figcaption", { className: "text-center text-sm", "aria-live": "polite", children: img.caption }))] }, img.src))), list.length > 1 && (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: prev, "aria-label": "Previous slide", className: "absolute left-2 top-1/2 -translate-y-1/2 rounded bg-fg/50 p-2", "data-token": "--color-fg", children: _jsx("span", { className: "text-bg", "data-token": "--color-bg", children: "\u2039" }) }), _jsx("button", { type: "button", onClick: next, "aria-label": "Next slide", className: "absolute right-2 top-1/2 -translate-y-1/2 rounded bg-fg/50 p-2", "data-token": "--color-fg", children: _jsx("span", { className: "text-bg", "data-token": "--color-bg", children: "\u203A" }) })] }))] }));
}
