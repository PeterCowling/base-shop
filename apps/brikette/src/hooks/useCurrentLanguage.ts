// src/hooks/useCurrentLanguage.ts
//
// Returns the current locale by parsing the first pathname segment.
// Works with the static `prefix("<lng>", …)` route tree.
// --------------------------------------------------------------------------
// Use react-router-dom hooks; fall back gracefully when outside a Router
import { useLocation, useParams } from "react-router-dom";
import i18n from "@/i18n";
import { i18nConfig, type AppLanguage } from "../i18n.config";

export function useCurrentLanguage(): AppLanguage {
  // 1) Parse from current URL pathname (most stable across nested routers/tests)
  let fromPath: string | undefined;
  try {
    const routerLoc = useLocation();
    const pathname = routerLoc?.pathname ?? "";
    fromPath = pathname.split("/").filter(Boolean)[0];
  } catch {
    // ignore – not within a Router
  }

  // 2) Fallback to explicit ":lang" route param if provided
  let fromParam: string | undefined;
  try {
    const params = useParams();
    fromParam = params?.["lang"];
  } catch {
    // ignore – not within a Router
  }

  // 3) Last resort: parse from window (SSR/tests without Router)
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

    if (i18n.hasResourceBundle(candidate, "guides") || i18n.hasResourceBundle(candidate, "header")) {
      return typedCandidate;
    }
  }

  return i18nConfig.fallbackLng as AppLanguage;
}
