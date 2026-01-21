// apps/cover-me-pretty/src/runtimeContractManifest.ts
//
// Runtime contract manifest for the cover-me-pretty tenant app.
// This intentionally mirrors the template app's manifest shape so
// Thread B/Thread D can diff capabilities and routes between the
// canonical contract and this tenant runtime.
/* i18n-exempt file -- SHOP-3207 manifest enumerates literal route identifiers [ttl=2026-06-30] */
//
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
  appName: "@apps/cover-me-pretty",
  // This app has converged on the template runtime contract and is treated
  // as platform-compatible for Thread B / Thread D.
  platformCompatible: true,

  routes: {
    // The tenant app currently reuses the shared cart API surface.
    apiCart: {
      path: "/api/cart",
      runtime: "nodejs",
      uses: "@acme/platform-core/cartApiForShop",
    } satisfies ApiRouteDescriptor,

    // Checkout session route name and implementation should converge
    // on the template contract; document current path/runtime for now.
    apiCheckoutSession: {
      path: "/api/checkout-session",
      runtime: "nodejs",
      uses: "@acme/platform-core/checkout/session",
    } satisfies ApiRouteDescriptor,

    apiStripeWebhook: {
      path: "/api/stripe-webhook",
      runtime: "nodejs",
      uses: "@acme/platform-core/stripe-webhook",
    } satisfies ApiRouteDescriptor,

    apiReturn: {
      path: "/api/return",
      runtime: "edge",
      uses: "@acme/platform-core/repositories/rentalOrders.server",
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
        uses: "@acme/platform-core/previewTokens",
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
    // cover-me-pretty implements both the core rental return/refund flow via
    // `/api/return` and the optional home pickup branch (which is gated by
    // `returnService.homePickupEnabled` in shop settings).
    returnsHomePickup: true,

    // PB preview is wired via the shared preview routes; PB
    // marketing/legal routes may not yet follow the template pattern.
    pageBuilderPreview: true,
    pageBuilderMarketingPages: false,

    // System-only commerce blocks are available in the component
    // library, but the strict "system routes only" placement rule is
    // not yet enforced in all PB palettes.
    systemBlocks: {
      cartSection: true,
      checkoutSection: true,
    },
  },
} as const;

export type RuntimeContractManifest = typeof runtimeContractManifest;
