"use client";

import type { Locale } from "@types";
import { cn } from "@ui/utils/cn";

interface Props {
  /** Enabled locales */
  languages: readonly Locale[];
  /** Current selected locale */
  value: Locale;
  /** Callback when a locale is selected */
  onChange(locale: Locale): void;
  /** SEO records keyed by locale */
  seo?: Record<
    string,
    { title?: string; description?: string; image?: string }
  >;
  /** Locale that acts as the base / fallback */
  baseLocale?: Locale;
}

export default function SeoLanguageTabs({
  languages,
  value,
  onChange,
  seo = {},
  baseLocale,
}: Props) {
  const base = baseLocale ?? languages[0];
  return (
    <div className="flex flex-wrap gap-2">
      {languages.map((l) => {
        const isSelected = l === value;
        const inherited = l !== base && !seo[l];
        return (
          <button
            key={l}
            type="button"
            onClick={() => onChange(l)}
            className={cn(
              "rounded-full border px-2 py-0.5 text-xs font-medium",
              isSelected
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-fg hover:bg-muted/80",
              inherited && "opacity-50"
            )}
          >
            {l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
