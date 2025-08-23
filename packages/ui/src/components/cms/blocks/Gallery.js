"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import Image from "next/image";
export default function Gallery({ images = [] }) {
    if (!images.length)
        return null;
    return (_jsx("div", { className: "grid gap-2 sm:grid-cols-2 md:grid-cols-3", children: images.map((img) => (_jsx("div", { className: "relative aspect-square w-full", children: _jsx(Image, { src: img.src, alt: img.alt ?? "", fill: true, className: "rounded object-cover" }) }, img.src))) }));
}
