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

async function loadDemoData(env: { base?: string; variant?: string }) {
  jest.resetModules();
  if (env.base === undefined) delete process.env[BASE_KEY];
  else process.env[BASE_KEY] = env.base;
  if (env.variant === undefined) delete process.env[VARIANT_KEY];
  else process.env[VARIANT_KEY] = env.variant;
  return await import("../demoData");
}

afterEach(() => {
  restoreEnv();
  jest.resetModules();
});

describe("XA catalog data", () => {
  it("hydrates media URLs from Cloudflare base", async () => {
    const { XA_PRODUCTS } = await loadDemoData({
      base: "https://imagedelivery.net/hash",
      variant: "public",
    });
    expect(XA_PRODUCTS.length).toBeGreaterThan(0);
    const product = XA_PRODUCTS[0];
    expect(product.media.length).toBeGreaterThan(0);
    const url = product.media[0]?.url ?? "";
    expect(url).toBeTruthy();
    expect(url.startsWith("http")).toBe(true);
    expect(product.media[0]?.altText).toBeTruthy();
  });
});
