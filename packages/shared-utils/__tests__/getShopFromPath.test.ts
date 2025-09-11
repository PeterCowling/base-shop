import { getShopFromPath } from "../src/getShopFromPath";

describe("getShopFromPath", () => {
  it("returns shop slug from valid path", () => {
    expect(getShopFromPath("/cms/shop/my-shop/products")).toBe("my-shop");
  });

  it("returns undefined for missing shop segment or slug", () => {
    expect(getShopFromPath("/cms/foo/bar")).toBeUndefined();
    expect(getShopFromPath("/cms/shop")).toBeUndefined();
    expect(getShopFromPath(undefined)).toBeUndefined();
    expect(getShopFromPath("/shop/")).toBeUndefined();
    expect(getShopFromPath("/shop?x=1")).toBeUndefined();
  });

  it("handles paths with duplicate slashes", () => {
    expect(getShopFromPath("/cms//shop//my-shop//foo")).toBe("my-shop");
  });

  it("prefers query parameter over path segments", () => {
    expect(getShopFromPath("/cms/shop/my-shop/pages?shop=override")).toBe("override");
  });

  it("handles plural shops segment", () => {
    expect(getShopFromPath("/cms/shops/my-shop")).toBe("my-shop");
  });

  it("returns undefined when no recognizable shop segment exists", () => {
    expect(getShopFromPath("/shop-123/product/456")).toBeUndefined();
  });
});
