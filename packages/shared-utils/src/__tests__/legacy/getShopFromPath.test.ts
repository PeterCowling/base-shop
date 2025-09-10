import { getShopFromPath } from "../../getShopFromPath";

describe("getShopFromPath", () => {
  it("returns the shop slug even with extra slashes", () => {
    expect(getShopFromPath("/cms//shop/demo///pages")).toBe("demo");
  });

  it("returns the shop slug for /shops/:slug paths", () => {
    expect(getShopFromPath("/cms/shops/demo/pages")).toBe("demo");
  });

  it("returns the shop slug from ?shop=:slug query parameter", () => {
    expect(getShopFromPath("/cms/pages?shop=demo")).toBe("demo");
  });

  it("query ?shop= slug overrides path segment", () => {
    expect(
      getShopFromPath("/cms/shop/demo/pages?shop=override"),
    ).toBe("override");
    expect(
      getShopFromPath("/cms/shops/demo/pages?shop=override"),
    ).toBe("override");
  });

  it("handles trailing slashes for shop paths", () => {
    expect(getShopFromPath("/cms/shop/demo/")).toBe("demo");
    expect(getShopFromPath("/cms/shops/demo/")).toBe("demo");
  });

  it("handles additional nested segments after the slug", () => {
    expect(getShopFromPath("/shop/demo/products/123")).toBe("demo");
    expect(getShopFromPath("/shops/demo/settings/profile")).toBe("demo");
  });

  it("returns undefined when the shop segment is missing", () => {
    expect(getShopFromPath("/cms/foo/bar")).toBeUndefined();
    expect(getShopFromPath("/cms/foo/bar/")).toBeUndefined();
    expect(getShopFromPath("/cms/pages?foo=bar")).toBeUndefined();
  });

  it("returns undefined when no slug is present", () => {
    expect(getShopFromPath("/cms/shops/")).toBeUndefined();
    expect(getShopFromPath("/cms/pages?shop=")).toBeUndefined();
  });

  it("returns undefined for null or undefined inputs", () => {
    expect(getShopFromPath(null)).toBeUndefined();
    expect(getShopFromPath(undefined)).toBeUndefined();
  });
});
