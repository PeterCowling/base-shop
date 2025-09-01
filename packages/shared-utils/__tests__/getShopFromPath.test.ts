import { getShopFromPath } from "../src/getShopFromPath";

describe("getShopFromPath", () => {
  it("returns shop slug from valid path", () => {
    expect(getShopFromPath("/cms/shop/my-shop/products")).toBe("my-shop");
  });

  it("returns undefined for missing shop segment or slug", () => {
    expect(getShopFromPath("/cms/foo/bar")).toBeUndefined();
    expect(getShopFromPath("/cms/shop")).toBeUndefined();
    expect(getShopFromPath(undefined)).toBeUndefined();
  });

  it("handles paths with duplicate slashes", () => {
    expect(getShopFromPath("/cms//shop//my-shop//foo")).toBe("my-shop");
  });
});
