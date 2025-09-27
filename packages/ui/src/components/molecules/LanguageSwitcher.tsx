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
              ? "font-semibold underline" // i18n-exempt: class names
              : "text-muted hover:underline" // i18n-exempt: class names
          }
        >
          {/* i18n-exempt: language code label */}
          {locale.toUpperCase()}
        </Link>
      ))}
    </Inline>
  );
}
