"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useLocale } from "@/contexts/LocaleContext";
import { getPreferredLocale } from "@/lib/localePreference";
import { replaceLocaleInPath } from "@/lib/routes";

export default function LocalePreferenceSync() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const syncLocale = useCallback(() => {
    const preferred = getPreferredLocale();
    if (!preferred || preferred === locale) return;
    const nextPath = replaceLocaleInPath(pathname ?? "/", preferred);
    router.replace(nextPath);
  }, [locale, pathname, router]);

  useEffect(() => {
    syncLocale();
  }, [syncLocale]);

  return null;
}
