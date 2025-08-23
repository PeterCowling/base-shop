// packages/ui/components/organisms/LanguageSwitcher.tsx
"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { Locale, locales } from "@acme/i18n/locales";
import Link from "next/link";
export default function LanguageSwitcher({ current }) {
    return (_jsx("div", { className: "flex gap-2 text-sm", children: locales.map((locale) => (_jsx(Link, { href: `/${locale}`, className: locale === current
                ? "font-semibold underline"
                : "text-muted hover:underline", children: locale.toUpperCase() }, locale))) }));
}
