import {
  getProductBySlug,
  getProductById,
  assertLocale,
  isSKU,
  PRODUCTS,
} from "../index";

describe("getProductBySlug", () => {
  it("returns the matching SKU for a known slug", () => {
    const product = getProductBySlug("green-sneaker");
    expect(product?.id).toBe("green-sneaker");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getProductBySlug("unknown-slug")).toBeUndefined();
  });

  it("fills missing optional fields with defaults", () => {
    const partialSku: any = {
      id: "partial-sku",
      slug: "partial-sku",
      price: 50,
      stock: 1,
    };
    (PRODUCTS as unknown as any[]).push(partialSku);
    const product = getProductBySlug("partial-sku");
    expect(product).toBeDefined();
    expect(product?.title).toBe("");
    expect(product?.description).toBe("");
    expect(product?.media).toEqual([]);
    expect(product?.sizes).toEqual([]);
    expect(product?.deposit).toBe(0);
    expect(product?.forSale).toBe(false);
    expect(product?.forRental).toBe(false);
    (PRODUCTS as unknown as any[]).pop();
  });
});

describe("getProductById", () => {
  it("returns the SKU when in stock", () => {
    const product = getProductById("sand-sneaker");
    expect(product?.id).toBe("sand-sneaker");
  });

  it("returns undefined for out-of-stock or unknown SKU", () => {
    expect(getProductById("black-sneaker")).toBeUndefined();
  });

  it("returns undefined when SKU validation fails", () => {
    const invalidSku: any = {
      id: "broken-sku",
      slug: "broken-sku",
      price: "free",
      stock: 1,
    };
    (PRODUCTS as unknown as any[]).push(invalidSku);
    expect(getProductBySlug("broken-sku")).toBeUndefined();
    expect(getProductById("broken-sku")).toBeUndefined();
    (PRODUCTS as unknown as any[]).pop();
  });

  it("fills missing optional fields with defaults", () => {
    const partialSku: any = {
      id: "partial-id",
      slug: "partial-id",
      price: 50,
      stock: 1,
    };
    (PRODUCTS as unknown as any[]).push(partialSku);
    const product = getProductById("partial-id");
    expect(product).toBeDefined();
    expect(product?.title).toBe("");
    expect(product?.description).toBe("");
    expect(product?.media).toEqual([]);
    expect(product?.sizes).toEqual([]);
    expect(product?.deposit).toBe(0);
    expect(product?.forSale).toBe(false);
    expect(product?.forRental).toBe(false);
    (PRODUCTS as unknown as any[]).pop();
  });
});

describe("assertLocale", () => {
  it("returns the same locale that is passed in", () => {
    const locale = "de";
    expect(assertLocale(locale)).toBe(locale);
  });
});

describe("isSKU", () => {
  it("accepts valid SKU objects", () => {
    const valid = { id: "1", slug: "slug", price: 100, stock: 1 };
    expect(isSKU(valid)).toBe(true);
  });

  it("rejects objects missing required fields", () => {
    const invalid = { id: "1", slug: "slug", price: "100" } as any;
    expect(isSKU(invalid)).toBe(false);
  });
});
