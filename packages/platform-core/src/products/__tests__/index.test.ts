import {
  assertLocale,
  getProductById,
  getProductBySlug,
  isSKU,
  PRODUCTS,
} from "../index";

describe("PRODUCTS constant", () => {
  it("contains the expected mock catalogue", () => {
    expect(PRODUCTS).toHaveLength(3);
    const [green, sand, black] = PRODUCTS;
    expect(green.forRental).toBe(false);
    expect(sand.forRental).toBe(true);
    expect(black.stock).toBe(0);
    expect(green.media[0]).toEqual({ url: "/shop/green.jpg", type: "image" });
  });
});

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

  it("returns undefined when stock is negative", () => {
    const negativeSku: any = {
      id: "negative-sku",
      slug: "negative-sku",
      price: 50,
      stock: -1,
    };
    (PRODUCTS as unknown as any[]).push(negativeSku);
    expect(getProductById("negative-sku")).toBeUndefined();
    (PRODUCTS as unknown as any[]).pop();
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

  it.each([
    ["missing id", { slug: "slug", price: 100, stock: 1 }],
    ["non-string id", { id: 1, slug: "slug", price: 100, stock: 1 }],
    ["missing slug", { id: "1", price: 100, stock: 1 }],
    ["non-string slug", { id: "1", slug: 2, price: 100, stock: 1 }],
    ["missing price", { id: "1", slug: "slug", stock: 1 }],
    ["non-number price", { id: "1", slug: "slug", price: "100", stock: 1 }],
    ["missing stock", { id: "1", slug: "slug", price: 100 }],
    ["non-number stock", { id: "1", slug: "slug", price: 100, stock: "1" }],
  ])("rejects SKU with %s", (_, invalid) => {
    expect(isSKU(invalid as any)).toBe(false);
  });

  it("rejects non-object values", () => {
    expect(isSKU(null)).toBe(false);
    expect(isSKU("sku" as any)).toBe(false);
  });
});
