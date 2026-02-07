// src/hooks/useCurrentLanguage.ts
//
// Returns the current locale by parsing the first pathname segment.
// Works with Next.js App Router dynamic routes like /[lang]/...
// --------------------------------------------------------------------------
import { useParams,usePathname } from "next/navigation";

import { type AppLanguage,i18nConfig } from "../i18n.config";

export function useCurrentLanguage(): AppLanguage {
  // 1) Parse from current URL pathname (most stable)
  let fromPath: string | undefined;
  try {
    const pathname = usePathname();
    fromPath = pathname?.split("/").filter(Boolean)[0];
  } catch {
    // ignore – not within Next.js context
  }

  // 2) Fallback to explicit "lang" route param if provided
  let fromParam: string | undefined;
  try {
    const params = useParams();
    fromParam = params?.lang as string | undefined;
  } catch {
    // ignore – not within Next.js context
  }

  // 3) Last resort: parse from window (SSR/tests)
  let fromWindow: string | undefined;
  if (!fromPath && typeof window !== "undefined") {
    const pathname = window.location.pathname ?? "";
    fromWindow = pathname.split("/").filter(Boolean)[0];
  }

  const candidate = fromPath || fromParam || fromWindow;
  if (candidate) {
    const typedCandidate = candidate as AppLanguage;
    if (i18nConfig.supportedLngs.includes(typedCandidate)) {
      return typedCandidate;
    }
  }

  return i18nConfig.fallbackLng as AppLanguage;
}
