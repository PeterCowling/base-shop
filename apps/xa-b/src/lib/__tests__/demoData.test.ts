import { afterEach, describe, expect, it, jest } from "@jest/globals";

import catalogRuntime from "../../data/catalog.runtime.json";

const BASE_KEY = "NEXT_PUBLIC_XA_IMAGES_BASE_URL";
const VARIANT_KEY = "NEXT_PUBLIC_XA_IMAGES_VARIANT";
const MAX_AGE_KEY = "NEXT_PUBLIC_XA_CATALOG_MAX_AGE_HOURS";
const ORIGINAL_ENV = { ...process.env };

function restoreEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in ORIGINAL_ENV)) delete process.env[key];
  }
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    process.env[key] = value;
  }
}

async function loadDemoData(env: { base?: string; variant?: string; maxAgeHours?: string }) {
  jest.resetModules();
  if (env.base === undefined) delete process.env[BASE_KEY];
  else process.env[BASE_KEY] = env.base;
  if (env.variant === undefined) delete process.env[VARIANT_KEY];
  else process.env[VARIANT_KEY] = env.variant;
  if (env.maxAgeHours === undefined) delete process.env[MAX_AGE_KEY];
  else process.env[MAX_AGE_KEY] = env.maxAgeHours;
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

  it("exposes runtime freshness metadata without contract URL leakage", async () => {
    const { XA_CATALOG_RUNTIME_FRESHNESS, XA_CATALOG_RUNTIME_META } = await loadDemoData({
      base: "https://imagedelivery.net/hash",
      variant: "public",
      maxAgeHours: "48",
    });

    expect(typeof XA_CATALOG_RUNTIME_FRESHNESS.isStale).toBe("boolean");
    expect("readUrl" in XA_CATALOG_RUNTIME_META).toBe(false);
    expect("runtimeMetaPath" in XA_CATALOG_RUNTIME_META).toBe(false);
    expect("artifactPath" in XA_CATALOG_RUNTIME_META).toBe(false);
    expect("details" in XA_CATALOG_RUNTIME_META).toBe(false);
  });

  it("does not assign inferred/fallback roles to legacy media without explicit roles", async () => {
    const { XA_PRODUCTS } = await loadDemoData({
      base: "https://imagedelivery.net/hash",
      variant: "public",
    });

    const productsBySlug = new Map(XA_PRODUCTS.map((product) => [product.slug, product]));
    const seed = catalogRuntime as {
      products?: Array<{ slug: string; media?: Array<{ type?: string; role?: string | null }> }>;
    };

    const allRolelessSeedProducts = (seed.products ?? []).filter((product) => {
      const imageMedia = (product.media ?? []).filter((item) => item.type === "image");
      if (imageMedia.length === 0) return false;
      return imageMedia.every((item) => !(item.role ?? "").trim());
    });

    expect(allRolelessSeedProducts.length).toBeGreaterThan(0);

    for (const seedProduct of allRolelessSeedProducts) {
      const hydrated = productsBySlug.get(seedProduct.slug);
      expect(hydrated).toBeTruthy();
      const hydratedImageMedia = (hydrated?.media ?? []).filter((item) => item.type === "image");
      expect(hydratedImageMedia.length).toBeGreaterThan(0);
      expect(hydratedImageMedia.every((item) => !item.role)).toBe(true);
    }
  });
});
