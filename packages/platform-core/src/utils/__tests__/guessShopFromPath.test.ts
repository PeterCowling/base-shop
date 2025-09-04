import { getShopFromPath as guessShopFromPath } from "../getShopFromPath";

describe("guessShopFromPath", () => {
  it("returns shop slug from valid path", () => {
    expect(guessShopFromPath("/cms/shop/my-shop/products")).toBe("my-shop");
  });

  it("returns undefined for missing shop segment or slug", () => {
    expect(guessShopFromPath("/cms/foo/bar")).toBeUndefined();
    expect(guessShopFromPath("/cms/shop")).toBeUndefined();
    expect(guessShopFromPath("/cms/shop/")).toBeUndefined();
  });

  it("handles paths with duplicate slashes", () => {
    expect(guessShopFromPath("/cms//shop//my-shop//foo")).toBe("my-shop");
  });

  it("returns undefined for null or undefined inputs", () => {
    expect(guessShopFromPath(null)).toBeUndefined();
    expect(guessShopFromPath(undefined)).toBeUndefined();
  });
});
