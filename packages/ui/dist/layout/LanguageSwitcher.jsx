// src/components/layout/LanguageSwitcher.tsx     ← NEW
"use client";
import { locales } from "@/i18n/locales";
import Link from "next/link";
export default function LanguageSwitcher({ current }) {
    return (<div className="flex gap-2 text-sm">
      {locales.map((l) => (<Link href={`/${l}`} key={l} className={l === current
                ? "underline font-semibold"
                : "text-gray-500 hover:underline"}>
          {l.toUpperCase()}
        </Link>))}
    </div>);
}
