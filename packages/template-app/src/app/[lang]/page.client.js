// packages/template-app/src/app/[lang]/page.tsx
"use client";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import HeroBanner from "@/components/home/HeroBanner";
import ReviewsCarousel from "@/components/home/ReviewsCarousel";
import { ValueProps } from "@/components/home/ValueProps";
export default function Home() {
    return (_jsxs(_Fragment, { children: [_jsx(HeroBanner, {}), _jsx(ValueProps, {}), _jsx(ReviewsCarousel, {})] }));
}
