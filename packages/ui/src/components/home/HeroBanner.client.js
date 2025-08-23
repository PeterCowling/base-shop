// src/components/home/HeroBanner.tsx
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslations } from "@acme/i18n";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
const DEFAULT_SLIDES = [
    {
        src: "/hero/slide-1.jpg",
        alt: "Man wearing eco sneaker on concrete",
        headlineKey: "hero.slide1.headline",
        ctaKey: "hero.cta",
    },
    {
        src: "/hero/slide-2.jpg",
        alt: "Close-up of recycled rubber sole",
        headlineKey: "hero.slide2.headline",
        ctaKey: "hero.cta",
    },
    {
        src: "/hero/slide-3.jpg",
        alt: "Pair of sneakers on mossy rock",
        headlineKey: "hero.slide3.headline",
        ctaKey: "hero.cta",
    },
];
export default function HeroBanner({ slides = DEFAULT_SLIDES, }) {
    const t = useTranslations();
    const pathname = usePathname(); // e.g. "/en" or "/en/shop"
    const langPrefix = pathname.split("/")[1] || "en";
    const [index, setIndex] = useState(0);
    // memoised handlers
    const slideData = slides.length ? slides : DEFAULT_SLIDES;
    const next = useCallback(() => setIndex((i) => (i + 1) % slideData.length), [slideData.length]);
    const prev = useCallback(() => setIndex((i) => (i - 1 + slideData.length) % slideData.length), [slideData.length]);
    // auto-advance
    useEffect(() => {
        const id = setInterval(next, 6000);
        return () => clearInterval(id);
    }, [next]);
    const slide = useMemo(() => slideData[index], [index, slideData]);
    return (_jsxs("section", { className: "relative h-[60vh] w-full overflow-hidden", children: [_jsx(Image, { src: slide.src, alt: slide.alt, fill: true, sizes: "100vw", priority: true, className: "object-cover transition-opacity duration-700" }), _jsx("div", { className: "absolute inset-0 bg-fg/40", "data-token": "--color-fg" }), _jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center px-4 text-center text-bg", "data-token": "--color-bg", children: [" ", _jsx("h2", { className: "mb-6 max-w-3xl text-4xl font-bold drop-shadow-md md:text-5xl", children: t(slide.headlineKey) }), _jsx(Link, { href: `/${langPrefix}/shop`, className: "inline-block rounded-full bg-fg px-[calc(var(--space-4)*2)] py-3 font-semibold shadow-lg transition-colors hover:bg-muted", "data-token": "--color-fg", children: _jsx("span", { className: "text-bg", "data-token": "--color-bg", children: t(slide.ctaKey) }) })] }), _jsx("button", { "aria-label": "Previous slide", onClick: prev, className: "absolute top-1/2 left-[var(--space-4)] -translate-y-1/2 rounded-full bg-fg/50 p-1 hover:bg-fg/70", "data-token": "--color-fg", children: "\u2039" }), _jsx("button", { "aria-label": "Next slide", onClick: next, className: "absolute top-1/2 right-[var(--space-4)] -translate-y-1/2 rounded-full bg-fg/50 p-1 hover:bg-fg/70", "data-token": "--color-fg", children: "\u203A" })] }));
}
