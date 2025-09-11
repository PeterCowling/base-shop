import { replaceShopInPath } from "../replaceShopInPath";

describe("replaceShopInPath", () => {
  it("replaces existing shop slug", () => {
    expect(replaceShopInPath("/cms/shop/old/pages", "new")).toBe(
      "/cms/shop/new/pages"
    );
  });

  it("leaves path unchanged when slug already matches", () => {
    expect(replaceShopInPath("/cms/shop/new/pages", "new")).toBe(
      "/cms/shop/new/pages"
    );
  });

  it("returns default pattern when shop segment missing", () => {
    expect(replaceShopInPath("/cms/blog", "new")).toBe("/cms/shop/new");
  });

  it("handles null or undefined pathname", () => {
    expect(replaceShopInPath(null, "new")).toBe("/cms/shop/new");
    expect(replaceShopInPath(undefined, "new")).toBe("/cms/shop/new");
  });

  it("preserves query parameters", () => {
    expect(replaceShopInPath("/cms/shop?x=1", "new")).toBe(
      "/cms/shop/new?x=1"
    );
  });

  it("preserves existing query strings when replacing slug", () => {
    expect(
      replaceShopInPath("/cms/shop/old/pages?x=1&y=2", "new")
    ).toBe("/cms/shop/new/pages?x=1&y=2");
  });

  it("handles path ending with shop", () => {
    expect(replaceShopInPath("/cms/shop", "new")).toBe("/cms/shop/new");
  });

  it("handles trailing slashes and multiple consecutive slashes", () => {
    expect(replaceShopInPath("/cms//shop//old///", "new")).toBe(
      "/cms/shop/new"
    );
  });
});
