// packages/platform-core/__tests__/replaceShopInPath.test.ts
import { replaceShopInPath } from "../utils/replaceShopInPath";

describe("replaceShopInPath", () => {
  it("replaces the existing shop segment", () => {
    expect(replaceShopInPath("/cms/shop/foo/products", "bar")).toBe(
      "/cms/shop/bar/products"
    );
    expect(replaceShopInPath("/cms/shop/foo", "bar")).toBe("/cms/shop/bar");
  });

  it("falls back when no shop segment is present", () => {
    expect(replaceShopInPath("/cms", "bar")).toBe("/cms/shop/bar");
    expect(replaceShopInPath(undefined, "bar")).toBe("/cms/shop/bar");
  });
});
