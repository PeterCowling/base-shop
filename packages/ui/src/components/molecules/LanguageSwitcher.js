// packages/ui/components/organisms/LanguageSwitcher.tsx
"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { locales } from "@/i18n/locales";
import Link from "next/link";
export default function LanguageSwitcher({ current }) {
    return (_jsx("div", { className: "flex gap-2 text-sm", children: locales.map((l) => (_jsx(Link, { href: `/${l}`, className: l === current
                ? "font-semibold underline"
                : "text-gray-500 hover:underline", children: l.toUpperCase() }, l))) }));
}
