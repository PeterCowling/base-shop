export type RouteKind = "shop" | "webhook";

type AllowRule = {
  path: string;
  methods: readonly string[];
  kind: RouteKind;
};

const RULES: AllowRule[] = [
  { path: "/api/checkout-session", methods: ["POST"], kind: "shop" },
  { path: "/api/checkout/session", methods: ["POST"], kind: "shop" },

  { path: "/api/order-status", methods: ["GET"], kind: "shop" },

  { path: "/api/inventory/validate", methods: ["POST"], kind: "shop" },

  { path: "/api/return", methods: ["POST"], kind: "shop" },
  { path: "/api/rental", methods: ["POST", "PATCH"], kind: "shop" },

  { path: "/api/subscribe", methods: ["POST"], kind: "shop" },
  { path: "/api/subscription/change", methods: ["POST"], kind: "shop" },
  { path: "/api/subscription/cancel", methods: ["POST"], kind: "shop" },

  // Webhooks never rely on x-shop-id.
  { path: "/api/stripe-webhook", methods: ["POST"], kind: "webhook" },
  { path: "/api/stripe/webhook", methods: ["POST"], kind: "webhook" },
  { path: "/api/billing/webhook", methods: ["POST"], kind: "webhook" },

  { path: "/api/reconciliation", methods: ["POST"], kind: "shop" },
];

export function getRouteKind(pathname: string, method: string): RouteKind | null {
  const normalizedMethod = method.toUpperCase();
  for (const rule of RULES) {
    if (pathname === rule.path && rule.methods.includes(normalizedMethod)) return rule.kind;
  }
  return null;
}
