// packages/template-app/src/runtimeContractManifest.ts
//
// Runtime contract manifest for the template app.
// Docs: docs/runtime/template-contract.md
//
// This is intentionally small and literal so tests and tooling can assert
// that key routes and capabilities remain wired as expected.
/* i18n-exempt file -- OPS-3200 runtime manifest enumerates literal route and package identifiers [ttl=2026-12-31] */

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
  // Human-readable note about where the implementation lives.
  uses?: string;
};

type PreviewContract = {
  pageRoute: string;
  workerRoute: string;
  apiPreviewRoute: ApiRouteDescriptor;
  apiPreviewTokenRoute: ApiRouteDescriptor;
};

export const runtimeContractManifest = {
  appName: "@acme/template-app",
  platformCompatible: true,

  routes: {
    apiCart: {
      path: "/api/cart",
      runtime: "nodejs",
      uses: "@platform-core/cartApi",
    } satisfies ApiRouteDescriptor,

    apiCheckoutSession: {
      path: "/api/checkout-session",
      runtime: "nodejs",
      uses: "@platform-core/checkout/session",
    } satisfies ApiRouteDescriptor,

    apiStripeWebhook: {
      path: "/api/stripe-webhook",
      runtime: "nodejs",
      uses: "@platform-core/stripe-webhook",
    } satisfies ApiRouteDescriptor,

    apiReturn: {
      path: "/api/return",
      runtime: "edge",
      uses: "@platform-core/repositories/rentalOrders.server",
    } satisfies ApiRouteDescriptor,

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
        uses: "@platform-core/previewTokens",
      },
    } satisfies PreviewContract,
  },

  capabilities: {
    cart: true,
    checkout: true,
    webhooks: true,
    paymentsMode: "checkout_session_custom" satisfies PaymentsMode,
    taxMode: "static_rates" satisfies TaxMode,
    inventoryMode: "validate_only" satisfies InventoryMode,
    identityMode: "per_site" satisfies IdentityMode,
    profileApi: false,
    logoutMode: "local" satisfies LogoutMode,
    orderLinking: "none" satisfies OrderLinkingMode,
    returns: true,
    preview: true,
    // Return flows:
    // - rental return/refund via `/api/return`
    // - home pickup scheduling via the same endpoint (zip/date/time shape)
    returnsHomePickup: true,

    // Page Builder integration:
    // - preview via `/preview/[pageId]` is implemented today.
    // - marketing/legal PB routes (e.g. `/[lang]/pages/[slug]`) are not yet wired.
    pageBuilderPreview: true,
    pageBuilderMarketingPages: false,

    systemBlocks: {
      cartSection: true,
      checkoutSection: true,
    },
  },
} as const;

export type RuntimeContractManifest = typeof runtimeContractManifest;
