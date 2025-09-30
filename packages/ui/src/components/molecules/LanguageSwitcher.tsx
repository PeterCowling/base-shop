// packages/ui/components/organisms/LanguageSwitcher.tsx
"use client";

import { Locale, locales } from "@acme/i18n/locales";
import Link from "next/link";
import { Inline } from "../atoms/primitives";

export default function LanguageSwitcher({ current }: { current: Locale }) {
  return (
    <Inline gap={2} className="text-sm">
      {locales.map((locale: Locale) => (
        <Link
          href={`/${locale}`}
          key={locale}
          className={
            locale === current
              ? "font-semibold underline" // i18n-exempt -- DS-1234 [ttl=2025-11-30]
              : "text-muted hover:underline" // i18n-exempt -- DS-1234 [ttl=2025-11-30]
          }
        >
          {/* i18n-exempt -- DS-1234 [ttl=2025-11-30] */}
          {locale.toUpperCase()}
        </Link>
      ))}
    </Inline>
  );
}
