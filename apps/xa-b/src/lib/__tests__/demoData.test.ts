import { afterEach, describe, expect, it, jest } from "@jest/globals";

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
  jest.unmock("../../data/catalog.runtime.json");
  if (env.base === undefined) delete process.env[BASE_KEY];
  else process.env[BASE_KEY] = env.base;
  if (env.variant === undefined) delete process.env[VARIANT_KEY];
  else process.env[VARIANT_KEY] = env.variant;
  if (env.maxAgeHours === undefined) delete process.env[MAX_AGE_KEY];
  else process.env[MAX_AGE_KEY] = env.maxAgeHours;
  return await import("../demoData");
}

async function loadDemoDataWithCatalogMock(
  env: { base?: string; variant?: string; maxAgeHours?: string },
  catalogMock: unknown,
) {
  jest.resetModules();
  jest.doMock("../../data/catalog.runtime.json", () => catalogMock);
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
    const catalogMock = {
      collections: [],
      brands: [],
      products: [
        {
          id: "legacy-roleless-1",
          slug: "legacy-roleless-1",
          title: "Legacy Roleless Product",
          brand: "legacy-brand",
          collection: "legacy-collection",
          price: 100,
          prices: { USD: 100 },
          status: "live",
          sizes: ["OS"],
          description: "legacy",
          createdAt: "2026-03-05T00:00:00.000Z",
          popularity: 1,
          taxonomy: {
            department: "women",
            category: "bags",
            subcategory: "crossbody",
          },
          media: [
            {
              type: "image",
              path: "xa-b/legacy-roleless-1/front.jpg",
              altText: "front view",
            },
            {
              type: "image",
              path: "xa-b/legacy-roleless-1/side.jpg",
              altText: "side view",
            },
          ],
        },
      ],
    };

    const { XA_PRODUCTS } = await loadDemoDataWithCatalogMock(
      {
        base: "https://imagedelivery.net/hash",
        variant: "public",
      },
      catalogMock,
    );

    expect(XA_PRODUCTS.length).toBe(1);
    const hydrated = XA_PRODUCTS[0];
    expect(hydrated).toBeTruthy();
    const hydratedImageMedia = (hydrated?.media ?? []).filter((item) => item.type === "image");
    expect(hydratedImageMedia.length).toBeGreaterThan(0);
    expect(hydratedImageMedia.every((item) => !item.role)).toBe(true);
  });

  it("retains explicit media roles from catalog seed", async () => {
    const catalogMock = {
      collections: [],
      brands: [],
      products: [
        {
          id: "explicit-role-1",
          slug: "explicit-role-1",
          title: "Explicit Role Product",
          brand: "legacy-brand",
          collection: "legacy-collection",
          price: 100,
          prices: { USD: 100 },
          status: "live",
          sizes: ["OS"],
          description: "explicit-role",
          createdAt: "2026-03-05T00:00:00.000Z",
          popularity: 1,
          taxonomy: {
            department: "women",
            category: "bags",
            subcategory: "crossbody",
          },
          media: [
            {
              type: "image",
              path: "xa-b/explicit-role-1/front.jpg",
              altText: "front",
              role: "front",
            },
          ],
        },
      ],
    };

    const { XA_PRODUCTS } = await loadDemoDataWithCatalogMock(
      {
        base: "https://imagedelivery.net/hash",
        variant: "public",
      },
      catalogMock,
    );

    expect(XA_PRODUCTS.length).toBe(1);
    const imageMedia = XA_PRODUCTS[0]?.media.filter((item) => item.type === "image") ?? [];
    expect(imageMedia.length).toBe(1);
    expect(imageMedia[0]?.role).toBe("front");
  });
});
