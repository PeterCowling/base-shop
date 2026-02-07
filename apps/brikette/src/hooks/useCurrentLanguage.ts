// src/hooks/useCurrentLanguage.ts
//
// Returns the current locale by parsing the first pathname segment.
// Works with Next.js App Router and Pages Router.
// --------------------------------------------------------------------------
"use client";

import { useParams, usePathname } from "next/navigation";

import i18n from "@/i18n";

import { type AppLanguage, i18nConfig } from "../i18n.config";

export function useCurrentLanguage(): AppLanguage {
  // 1) From route param (preferred in App Router)
  let fromParam: string | undefined;
  try {
    const params = useParams();
    const langParam = params?.["lang"];
    fromParam = typeof langParam === "string" ? langParam : undefined;
  } catch {
    // ignore – not within App Router
  }

  // 2) Parse from current URL pathname
  let fromPath: string | undefined;
  try {
    const pathname = usePathname();
    fromPath = pathname?.split("/").filter(Boolean)[0];
  } catch {
    // ignore – not within App Router
  }

  // 3) Last resort: parse from window (SSR/tests without Router)
  let fromWindow: string | undefined;
  if (!fromPath && !fromParam && typeof window !== "undefined") {
    const pathname = window.location.pathname ?? "";
    fromWindow = pathname.split("/").filter(Boolean)[0];
  }

  const candidate = fromParam || fromPath || fromWindow;
  if (candidate) {
    const typedCandidate = candidate as AppLanguage;
    if (i18nConfig.supportedLngs.includes(typedCandidate)) {
      return typedCandidate;
    }

    if (i18n.hasResourceBundle(candidate, "guides") || i18n.hasResourceBundle(candidate, "header")) {
      return typedCandidate;
    }
  }

  return i18nConfig.fallbackLng as AppLanguage;
}

/**
 * Server-safe version for use in server components.
 * Pass the params from `generateMetadata` or page props.
 */
export function getLanguageFromParams(params: { lang?: string }): AppLanguage {
  const lang = params.lang;
  if (typeof lang === "string" && i18nConfig.supportedLngs.includes(lang as AppLanguage)) {
    return lang as AppLanguage;
  }
  return i18nConfig.fallbackLng as AppLanguage;
}
