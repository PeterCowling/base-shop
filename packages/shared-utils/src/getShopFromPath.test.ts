import { getShopFromPath } from "./getShopFromPath";

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

  it("returns undefined when the shop segment is missing", () => {
    expect(getShopFromPath("/cms/foo/bar")).toBeUndefined();
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
