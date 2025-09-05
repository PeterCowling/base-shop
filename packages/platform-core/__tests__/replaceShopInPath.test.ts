// packages/platform-core/__tests__/replaceShopInPath.test.ts
import { replaceShopInPath } from "../src/utils/replaceShopInPath";

describe("replaceShopInPath", () => {
  it("returns default path when pathname is undefined or null", () => {
    expect(replaceShopInPath(undefined, "bar")).toBe("/cms/shop/bar");
    expect(replaceShopInPath(null, "bar")).toBe("/cms/shop/bar");
  });

  it("replaces existing shop segment", () => {
    expect(replaceShopInPath("/cms/shop/foo/products", "bar")).toBe(
      "/cms/shop/bar/products"
    );
    expect(replaceShopInPath("/cms/shop/foo", "bar")).toBe("/cms/shop/bar");
  });

  it("appends shop segment when pathname is '/cms'", () => {
    expect(replaceShopInPath("/cms", "bar")).toBe("/cms/shop/bar");
  });

  it("returns original path when '/shop' segment is absent", () => {
    expect(replaceShopInPath("/cms/other", "bar")).toBe("/cms/other");
  });

  it("appends slug when '/shop' is the last segment", () => {
    expect(replaceShopInPath("/cms/shop", "bar")).toBe("/cms/shop/bar");
  });
});
