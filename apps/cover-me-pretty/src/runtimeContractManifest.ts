// apps/cover-me-pretty/src/runtimeContractManifest.ts
//
// Runtime contract manifest for the cover-me-pretty tenant app.
// This intentionally mirrors the template app's manifest shape so
// Thread B/Thread D can diff capabilities and routes between the
// canonical contract and this tenant runtime.
/* i18n-exempt file -- SHOP-3207 manifest enumerates literal route identifiers [ttl=2026-06-30] */
//
type HttpRuntime = "nodejs" | "edge";

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
      uses: "@platform-core/cartApi",
    } satisfies ApiRouteDescriptor,

    // Checkout session route name and implementation should converge
    // on the template contract; document current path/runtime for now.
    apiCheckoutSession: {
      path: "/api/checkout-session",
      runtime: "edge",
      uses: "@platform-core/checkout/session",
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
