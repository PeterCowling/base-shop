"use client";
import { useMemo } from "react";
import type { Locale, TranslatableText } from "@acme/types";
import { useTranslations } from "./Translations";
import { resolveText } from "./resolveText";

/**
 * Hook that returns a memoized resolver bound to the current `t` and a supplied locale.
 */
export function useTextResolver(locale: Locale): (value: TranslatableText) => string {
  const t = useTranslations() as unknown as (key: string, params?: Record<string, unknown>) => string;
  return useMemo(() => {
    return (value: TranslatableText) => resolveText(value, locale, t);
  }, [locale, t]);
}

