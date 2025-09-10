import { replaceShopInPath } from "../replaceShopInPath";

describe("replaceShopInPath", () => {
  it("replaces existing shop slug", () => {
    expect(replaceShopInPath("/cms/shop/old/pages", "new")).toBe(
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
});
