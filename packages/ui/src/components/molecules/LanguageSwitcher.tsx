// packages/ui/components/organisms/LanguageSwitcher.tsx
"use client";

import { Locale, locales } from "@acme/i18n/locales";
import Link from "next/link";

export default function LanguageSwitcher({ current }: { current: Locale }) {
  return (
    <div className="flex gap-2 text-sm">
      {locales.map((locale: Locale) => (
        <Link
          href={`/${locale}`}
          key={locale}
          className={
            locale === current
              ? "font-semibold underline"
              : "text-muted hover:underline"
          }
        >
          {locale.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
