import { runtimeContractManifest } from "../src/runtimeContractManifest";

describe("cover-me-pretty runtimeContractManifest", () => {
  it("declares the app as platform-compatible", () => {
    expect(runtimeContractManifest.appName).toBe("@apps/cover-me-pretty");
    expect(runtimeContractManifest.platformCompatible).toBe(true);
  });

  it("describes the core API routes with correct paths and runtimes", () => {
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

  it("flags capabilities in line with the current implementation", () => {
    const { capabilities } = runtimeContractManifest;

    expect(capabilities.cart).toBe(true);
    expect(capabilities.checkout).toBe(true);
    expect(capabilities.returns).toBe(true);
    expect(capabilities.preview).toBe(true);

    expect(capabilities.returnsHomePickup).toBe(true);

    expect(capabilities.pageBuilderPreview).toBe(true);
    expect(capabilities.pageBuilderMarketingPages).toBe(false);

    expect(capabilities.systemBlocks.cartSection).toBe(true);
    expect(capabilities.systemBlocks.checkoutSection).toBe(true);
  });
});
