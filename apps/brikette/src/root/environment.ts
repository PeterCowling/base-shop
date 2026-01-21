import { IS_TEST } from "@/config/env";

import { DOMAIN } from "../config";
import { normaliseBrowserOrigin } from "../utils/origin";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]);

const getDocumentElement = (): HTMLElement | null =>
  typeof document !== "undefined" ? document.documentElement : null;

const isLoopbackOrigin = (origin: string | undefined): boolean => {
  if (!origin) return false;
  try {
    const { hostname } = new URL(origin);
    return LOOPBACK_HOSTS.has(hostname.toLowerCase());
  } catch {
    return false;
  }
};

const getOrigin = (): string => {
  const root = getDocumentElement();

  const hasWindow = typeof window !== "undefined";
  const rawBrowserOrigin = hasWindow ? window?.location?.origin ?? "" : "";
  const preset = root?.getAttribute("data-origin");

  // When window exists but origin is empty (e.g. tests overriding it), do
  // not reuse a previously cached data-origin; fall back to DOMAIN.
  if (hasWindow && !rawBrowserOrigin) {
    return DOMAIN;
  }

  // Prefer an explicit preset when present (e.g. injected during SSR or tests).
  if (preset) {
    const normalisedPreset = normaliseBrowserOrigin(preset);
    return isLoopbackOrigin(normalisedPreset) ? DOMAIN : normalisedPreset;
  }

  // Otherwise, prefer the live browser origin whenever available. Cache it on
  // the document element for stability within a single runtime session.
  if (rawBrowserOrigin) {
    const browserOrigin = normaliseBrowserOrigin(rawBrowserOrigin);
    if (isLoopbackOrigin(browserOrigin) && !IS_TEST) {
      return DOMAIN;
    }
    if (root) root.setAttribute("data-origin", browserOrigin);
    return browserOrigin;
  }

  // Server-side or non-browser contexts with no preset: fall back to DOMAIN.
  return DOMAIN;
};

const getPathname = (): string =>
  typeof window !== "undefined" && window?.location?.pathname ? window.location.pathname : "/";

const isTestEnvironment = Boolean(
  IS_TEST ||
    (typeof globalThis !== "undefined" &&
      (globalThis as Record<string, unknown>)["__vitest_worker__"])
);

export { getOrigin, getPathname, isTestEnvironment };
