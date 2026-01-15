export type RouteTarget = "storefront" | "gateway" | "deny";

type AllowRule = {
  path: string;
  methods: readonly string[];
  target: Exclude<RouteTarget, "deny">;
};

const RULES: AllowRule[] = [
  // Storefront runtime routes (same-host)
  { path: "/api/cart", methods: ["GET", "POST", "PATCH", "PUT", "DELETE"], target: "storefront" },

  // Gateway → Node commerce authority routes
  { path: "/api/checkout-session", methods: ["POST"], target: "gateway" },
  // Legacy compatibility aliases
  { path: "/api/checkout/session", methods: ["POST"], target: "gateway" },

  { path: "/api/order-status", methods: ["GET"], target: "gateway" },

  { path: "/api/stripe-webhook", methods: ["POST"], target: "gateway" },
  { path: "/api/stripe/webhook", methods: ["POST"], target: "gateway" },

  { path: "/api/inventory/validate", methods: ["POST"], target: "gateway" },

  { path: "/api/return", methods: ["POST"], target: "gateway" },

  { path: "/api/rental", methods: ["POST", "PATCH"], target: "gateway" },

  { path: "/api/subscribe", methods: ["POST"], target: "gateway" },
  { path: "/api/subscription/change", methods: ["POST"], target: "gateway" },
  { path: "/api/subscription/cancel", methods: ["POST"], target: "gateway" },

  { path: "/api/billing/webhook", methods: ["POST"], target: "gateway" },

  { path: "/api/reconciliation", methods: ["POST"], target: "gateway" },
];

export function getRouteTarget(pathname: string, method: string): RouteTarget {
  if (!pathname.startsWith("/api/")) return "storefront";

  const normalizedMethod = method.toUpperCase();
  for (const rule of RULES) {
    if (pathname === rule.path && rule.methods.includes(normalizedMethod)) return rule.target;
  }
  return "deny";
}

export function shouldBypassLocalePrefix(pathname: string): boolean {
  if (pathname.startsWith("/_next/")) return true;
  if (
    pathname === "/account" ||
    pathname.startsWith("/account/") ||
    pathname === "/auth" ||
    pathname.startsWith("/auth/") ||
    pathname === "/cancelled" ||
    pathname.startsWith("/cancelled/") ||
    pathname === "/edit-preview" ||
    pathname.startsWith("/edit-preview/") ||
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/logout" ||
    pathname.startsWith("/logout/") ||
    pathname === "/password-reset" ||
    pathname.startsWith("/password-reset/") ||
    pathname === "/preview" ||
    pathname.startsWith("/preview/") ||
    pathname === "/returns" ||
    pathname.startsWith("/returns/") ||
    pathname === "/success" ||
    pathname.startsWith("/success/") ||
    pathname === "/upgrade-preview" ||
    pathname.startsWith("/upgrade-preview/")
  ) {
    return true;
  }
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/.well-known/") ||
    pathname.startsWith("/cms") ||
    isStaticAssetPath(pathname)
  );
}

function isStaticAssetPath(pathname: string): boolean {
  if (
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/site.webmanifest"
  ) {
    return true;
  }

  const lastSegment = pathname.split("/").pop() ?? "";
  return lastSegment.includes(".");
}

export function hasLocalePrefix(pathname: string): boolean {
  const match = pathname.match(/^\/([a-z]{2})(\/|$)/i);
  return Boolean(match);
}

export function addLocalePrefix(pathname: string, locale: string): string {
  const trimmed = locale.trim().toLowerCase();
  if (!trimmed) return pathname;
  if (pathname === "/") return `/${trimmed}`;
  return `/${trimmed}${pathname}`;
}
