// packages/ui/components/organisms/LanguageSwitcher.tsx
"use client";

import { Locale, locales } from "@/i18n/locales";
import Link from "next/link";

export default function LanguageSwitcher({ current }: { current: Locale }) {
  return (
    <div className="flex gap-2 text-sm">
      {locales.map((l) => (
        <Link
          href={`/${l}`}
          key={l}
          className={
            l === current
              ? "font-semibold underline"
              : "text-gray-500 hover:underline"
          }
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
