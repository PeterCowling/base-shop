 
// src/components/seo/locationUtils.ts
import { usePathname } from "next/navigation";

export function useOptionalRouterPathname(): string | undefined {
  try {
    const pathname = usePathname();
    return typeof pathname === "string" ? pathname : undefined;
  } catch {
    return undefined;
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
