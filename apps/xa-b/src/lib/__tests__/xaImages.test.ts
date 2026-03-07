import { afterEach, describe, expect, it, jest } from "@jest/globals";

const BASE_KEY = "NEXT_PUBLIC_XA_IMAGES_BASE_URL";
const VARIANT_KEY = "NEXT_PUBLIC_XA_IMAGES_VARIANT";
const ORIGINAL_ENV = { ...process.env };

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) delete process.env[key];
  }
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    process.env[key] = value;
  }
}

async function loadXaImages(env: { base?: string; variant?: string }) {
  jest.resetModules();
  if (env.base === undefined) delete process.env[BASE_KEY];
  else process.env[BASE_KEY] = env.base;
  if (env.variant === undefined) delete process.env[VARIANT_KEY];
  else process.env[VARIANT_KEY] = env.variant;
  return await import("../xaImages");
}

afterEach(() => {
  restoreEnv();
  jest.resetModules();
});

describe("buildXaImageUrl", () => {
  it("returns absolute URLs unchanged", async () => {
    const { buildXaImageUrl } = await loadXaImages({
      base: "https://imagedelivery.net/hash",
    });
    expect(buildXaImageUrl("https://example.com/img.jpg")).toBe(
      "https://example.com/img.jpg",
    );
  });

  it("falls back to /public-style path when base URL is not configured", async () => {
    const { buildXaImageUrl } = await loadXaImages({});
    expect(buildXaImageUrl("image-id")).toBe("/image-id");
  });

  it("appends the default variant when none is supplied", async () => {
    const { buildXaImageUrl } = await loadXaImages({
      base: "https://imagedelivery.net/hash/",
      variant: "public",
    });
    expect(buildXaImageUrl("/image-id")).toBe(
      "https://imagedelivery.net/hash/image-id/public",
    );
  });

  it("respects explicit variants already included in the path", async () => {
    const { buildXaImageUrl } = await loadXaImages({
      base: "https://imagedelivery.net/hash",
      variant: "public",
    });
    expect(buildXaImageUrl("image-id/hero")).toBe(
      "https://imagedelivery.net/hash/image-id/hero",
    );
  });

  describe("R2 image key resolution", () => {
    it("resolves R2 multi-segment key without appending variant (TC-01)", async () => {
      const { buildXaImageUrl } = await loadXaImages({
        base: "https://pub-xa-media.r2.dev",
        variant: "public",
      });
      expect(
        buildXaImageUrl("xa-b/hermes-constance-18/1709510400-front.jpg"),
      ).toBe(
        "https://pub-xa-media.r2.dev/xa-b/hermes-constance-18/1709510400-front.jpg",
      );
    });

    it("appends default variant for a bare key with R2 base URL (TC-02)", async () => {
      const { buildXaImageUrl } = await loadXaImages({
        base: "https://pub-xa-media.r2.dev",
        variant: "public",
      });
      expect(buildXaImageUrl("simple-path")).toBe(
        "https://pub-xa-media.r2.dev/simple-path/public",
      );
    });

    it("returns external absolute URL as-is regardless of R2 config (TC-03)", async () => {
      const { buildXaImageUrl } = await loadXaImages({
        base: "https://pub-xa-media.r2.dev",
        variant: "public",
      });
      expect(buildXaImageUrl("https://external.com/img.jpg")).toBe(
        "https://external.com/img.jpg",
      );
    });
  });
});
