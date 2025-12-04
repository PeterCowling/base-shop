import { runtimeContractManifest } from "../src/runtimeContractManifest";

describe("storefront runtimeContractManifest", () => {
  it("declares the app as a pilot convergence target (not yet platform-compatible)", () => {
    expect(runtimeContractManifest.appName).toBe("@apps/storefront");
    expect(runtimeContractManifest.platformCompatible).toBe(false);
  });

  it("exposes the expected route contract shape (placeholder values for now)", () => {
    const { apiCart, apiCheckoutSession, apiReturn, preview } =
      runtimeContractManifest.routes;

    expect(apiCart.path).toBe("/api/cart");
    expect(apiCart.runtime).toBe("nodejs");

    expect(apiCheckoutSession.path).toBe("/api/checkout-session");
    expect(apiCheckoutSession.runtime).toBe("edge");

    expect(apiReturn.path).toBe("/api/return");
    expect(apiReturn.runtime).toBe("edge");

    expect(preview.pageRoute).toBe("/preview/[pageId]");
    expect(preview.workerRoute).toBe("/preview/:pageId");
    expect(preview.apiPreviewRoute.path).toBe("/api/preview");
    expect(preview.apiPreviewRoute.runtime).toBe("nodejs");
    expect(preview.apiPreviewTokenRoute.path).toBe("/api/preview-token");
    expect(preview.apiPreviewTokenRoute.runtime).toBe("nodejs");
  });

  it("flags capabilities as not implemented yet", () => {
    const { capabilities } = runtimeContractManifest;

    expect(capabilities.cart).toBe(false);
    expect(capabilities.checkout).toBe(false);
    expect(capabilities.returns).toBe(false);
    expect(capabilities.preview).toBe(false);
    expect(capabilities.returnsHomePickup).toBe(false);

    expect(capabilities.pageBuilderPreview).toBe(false);
    expect(capabilities.pageBuilderMarketingPages).toBe(false);

    expect(capabilities.systemBlocks.cartSection).toBe(false);
    expect(capabilities.systemBlocks.checkoutSection).toBe(false);
  });
});
