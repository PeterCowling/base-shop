// apps/storefront/src/runtimeContractManifest.ts
//
// Runtime contract manifest for the storefront app.
// This mirrors the template app's manifest shape so Thread B / Thread D
// can track convergence over time. At the moment this app does not expose
// a full runtime/API surface; it is treated as a pilot convergence target.

type HttpRuntime = "nodejs" | "edge";
type PaymentsMode = "payment_intent" | "checkout_session_custom" | "hosted_checkout";
type TaxMode = "static_rates" | "taxjar_api" | "stripe_tax" | "custom";
type InventoryMode = "none" | "validate_only" | "reserve_ttl";
type IdentityMode = "none" | "per_site" | "sso_oidc";
type LogoutMode = "local" | "local_plus_idp" | "global";
type OrderLinkingMode = "none" | "email_verified" | "explicit_claim";

type ApiRouteDescriptor = {
  path: string;
  runtime: HttpRuntime;
  uses?: string;
};

type PreviewContract = {
  pageRoute: string;
  workerRoute: string;
  apiPreviewRoute: ApiRouteDescriptor;
  apiPreviewTokenRoute: ApiRouteDescriptor;
};

export const runtimeContractManifest = {
  appName: "@apps/storefront", // i18n-exempt -- TECH-1234 [ttl=2025-12-31] manifest identifier, not user-facing copy
  // Storefront currently provides shared UI/context logic but no full
  // runtime/API surface. It is a potential convergence target but not
  // treated as platform-compatible yet.
  platformCompatible: false,

  routes: {
    // No HTTP routes are wired here today; when storefront grows into a
    // full runtime, this section should be populated to match the
    // template contract (cart, checkout-session, return, preview).
    apiCart: {
      path: "/api/cart",
      runtime: "nodejs",
    } as ApiRouteDescriptor,
    apiCheckoutSession: {
      path: "/api/checkout-session",
      runtime: "edge",
    } as ApiRouteDescriptor,
    apiReturn: {
      path: "/api/return",
      runtime: "edge",
    } as ApiRouteDescriptor,
    preview: {
      pageRoute: "/preview/[pageId]",
      workerRoute: "/preview/:pageId",
      apiPreviewRoute: {
        path: "/api/preview",
        runtime: "nodejs",
      },
      apiPreviewTokenRoute: {
        path: "/api/preview-token",
        runtime: "nodejs",
      },
    } as PreviewContract,
  },

  capabilities: {
    cart: false,
    checkout: false,
    webhooks: false,
    paymentsMode: "payment_intent" satisfies PaymentsMode,
    taxMode: "static_rates" satisfies TaxMode,
    inventoryMode: "none" satisfies InventoryMode,
    identityMode: "none" satisfies IdentityMode,
    profileApi: false,
    logoutMode: "local" satisfies LogoutMode,
    orderLinking: "none" satisfies OrderLinkingMode,
    returns: false,
    preview: false,
    returnsHomePickup: false,
    pageBuilderPreview: false,
    pageBuilderMarketingPages: false,
    systemBlocks: {
      cartSection: false,
      checkoutSection: false,
    },
  },
} as const;

export type RuntimeContractManifest = typeof runtimeContractManifest;
