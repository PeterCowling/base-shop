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

  it("returns empty string when base URL is not configured", async () => {
    const { buildXaImageUrl } = await loadXaImages({});
    expect(buildXaImageUrl("image-id")).toBe("");
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
});
