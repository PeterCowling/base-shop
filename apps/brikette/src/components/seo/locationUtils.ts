/* eslint-disable ds/no-hardcoded-copy -- SEO-315 [ttl=2026-12-31] Schema.org structured data literals are non-UI. */
// src/components/seo/locationUtils.ts
import { useLocation } from "react-router-dom";

const ROUTER_CONTEXT_MESSAGES = [
  "useLocation() may be used only in the context of a <Router>",
  "You must render this element inside a <HydratedRouter> element",
];

export function useOptionalRouterPathname(): string | undefined {
  try {
    return useLocation().pathname;
  } catch (error) {
    if (error instanceof Error && typeof error.message === "string") {
      if (ROUTER_CONTEXT_MESSAGES.some((snippet) => error.message.includes(snippet))) {
        return undefined;
      }
    }
    throw error;
  }
}

export function normaliseWindowPath(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const { location } = window;
  if (!location) {
    return undefined;
  }

  const fromHref = (() => {
    if (typeof location.href !== "string" || typeof location.origin !== "string") {
      return undefined;
    }

    try {
      const relative = location.href.replace(location.origin, "");
      return relative || undefined;
    } catch {
      return undefined;
    }
  })();

  if (fromHref) {
    return fromHref;
  }

  const pathname = typeof location.pathname === "string" ? location.pathname : "/";
  const search = typeof location.search === "string" ? location.search : "";
  const hash = typeof location.hash === "string" ? location.hash : "";

  const combined = `${pathname}${search}${hash}`;
  return combined || "/";
}

export function ensureLeadingSlash(value: string | undefined): string {
  if (!value) {
    return "/";
  }

  return value.startsWith("/") ? value : `/${value}`;
}
