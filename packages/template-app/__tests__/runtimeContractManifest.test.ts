import { runtimeContractManifest } from "../src/runtimeContractManifest";

describe("runtimeContractManifest", () => {
  it("declares the template app as platform compatible", () => {
    expect(runtimeContractManifest.appName).toBe("@acme/template-app");
    expect(runtimeContractManifest.platformCompatible).toBe(true);
  });

  it("describes the core API routes with correct paths and runtimes", () => {
    const { apiCart, apiCheckoutSession, apiReturn } =
      runtimeContractManifest.routes;

    expect(apiCart.path).toBe("/api/cart");
    expect(apiCart.runtime).toBe("nodejs");
    expect(apiCart.uses).toBe("@platform-core/cartApi");

    expect(apiCheckoutSession.path).toBe("/api/checkout-session");
    expect(apiCheckoutSession.runtime).toBe("edge");
    expect(apiCheckoutSession.uses).toBe("@platform-core/checkout/session");

    expect(apiReturn.path).toBe("/api/return");
    expect(apiReturn.runtime).toBe("edge");
    expect(apiReturn.uses).toBe(
      "@platform-core/repositories/rentalOrders.server",
    );
  });

  it("captures the preview contract for pages and tokens", () => {
    const { preview } = runtimeContractManifest.routes;

    expect(preview.pageRoute).toBe("/preview/[pageId]");
    expect(preview.workerRoute).toBe("/preview/:pageId");

    expect(preview.apiPreviewRoute.path).toBe("/api/preview");
    expect(preview.apiPreviewRoute.runtime).toBe("nodejs");

    expect(preview.apiPreviewTokenRoute.path).toBe("/api/preview-token");
    expect(preview.apiPreviewTokenRoute.runtime).toBe("nodejs");
    expect(preview.apiPreviewTokenRoute.uses).toBe(
      "@platform-core/previewTokens",
    );
  });

  it("flags capabilities to match the current implementation", () => {
    const { capabilities } = runtimeContractManifest;

    expect(capabilities.cart).toBe(true);
    expect(capabilities.checkout).toBe(true);
    expect(capabilities.returns).toBe(true);
    expect(capabilities.preview).toBe(true);

    // Template app supports both the core return/refund flow and the
    // home pickup branch described in the contract.
    expect(capabilities.returnsHomePickup).toBe(true);

    expect(capabilities.pageBuilderPreview).toBe(true);
    expect(capabilities.pageBuilderMarketingPages).toBe(false);

    expect(capabilities.systemBlocks.cartSection).toBe(true);
    expect(capabilities.systemBlocks.checkoutSection).toBe(true);
  });
});
