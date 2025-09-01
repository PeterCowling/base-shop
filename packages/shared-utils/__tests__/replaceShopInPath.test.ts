import { replaceShopInPath } from "../src/replaceShopInPath";

describe("replaceShopInPath", () => {
  it("replaces shop slug in a valid path", () => {
    expect(replaceShopInPath("/cms/shop/old-shop/page", "new-shop")).toBe(
      "/cms/shop/new-shop/page"
    );
  });

  it("returns default path when missing shop segment or pathname", () => {
    expect(replaceShopInPath("/cms/foo/bar", "new-shop")).toBe(
      "/cms/shop/new-shop"
    );
    expect(replaceShopInPath(null, "new-shop")).toBe("/cms/shop/new-shop");
  });

  it("handles malformed paths with duplicate slashes or missing slug", () => {
    expect(replaceShopInPath("/cms/shop", "new-shop")).toBe(
      "/cms/shop/new-shop"
    );
    expect(replaceShopInPath("/cms//shop//old-shop", "new-shop")).toBe(
      "/cms/shop/new-shop"
    );
  });
});
