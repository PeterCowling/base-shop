import { getProductBySlug, getProductById, assertLocale } from "../index";

describe("getProductBySlug", () => {
  it("returns the matching SKU for a known slug", () => {
    const product = getProductBySlug("green-sneaker");
    expect(product?.id).toBe("green-sneaker");
  });

  it("applies defaults for missing optional fields", () => {
    const product = getProductBySlug("green-sneaker");
    expect(product).toMatchObject({
      dailyRate: 0,
      availability: [],
    });
  });

  it("returns undefined for an unknown slug", () => {
    expect(getProductBySlug("unknown-slug")).toBeUndefined();
  });
});

describe("getProductById", () => {
  it("returns the SKU when in stock", () => {
    const product = getProductById("sand-sneaker");
    expect(product?.id).toBe("sand-sneaker");
  });

  it("applies defaults for missing optional fields", () => {
    const product = getProductById("sand-sneaker");
    expect(product).toMatchObject({
      weeklyRate: 0,
      availability: [],
    });
  });

  it("returns undefined for out-of-stock or unknown SKU", () => {
    expect(getProductById("black-sneaker")).toBeUndefined();
  });
});

describe("assertLocale", () => {
  it("returns the same locale that is passed in", () => {
    const locale = "de";
    expect(assertLocale(locale)).toBe(locale);
  });
});
