// packages/platform-core/src/utils/path-helpers.test.ts
import { getShopFromPath } from "../getShopFromPath";
import { replaceShopInPath } from "../replaceShopInPath";

describe("getShopFromPath", () => {
  it("extracts shop codes from valid paths", () => {
    expect(getShopFromPath("/cms/shop/alpha")).toBe("alpha");
    expect(getShopFromPath("/cms/shop/bravo/products")).toBe("bravo");
  });

  it("returns undefined for missing segments", () => {
    expect(getShopFromPath("/cms/shop")).toBeUndefined();
    expect(getShopFromPath("/cms")).toBeUndefined();
    expect(getShopFromPath(null)).toBeUndefined();
  });

  it("ignores placeholder segments", () => {
    expect(getShopFromPath("/cms/shop/[shop]")).toBeUndefined();
    expect(getShopFromPath("/cms/shop/:shop")).toBeUndefined();
  });
});

describe("replaceShopInPath", () => {
  it("replaces existing shop codes", () => {
    expect(replaceShopInPath("/cms/shop/alpha/page", "bravo")).toBe(
      "/cms/shop/bravo/page"
    );
  });

  it("inserts shop codes when missing", () => {
    expect(replaceShopInPath("/cms/shop", "bravo")).toBe("/cms/shop/bravo");
    expect(replaceShopInPath("/cms", "bravo")).toBe("/cms/shop/bravo");
    expect(replaceShopInPath(undefined, "bravo")).toBe("/cms/shop/bravo");
  });

  it("leaves non-matching paths unchanged", () => {
    expect(replaceShopInPath("/cms/other", "bravo")).toBe("/cms/other");
    expect(replaceShopInPath("/foo/bar", "bravo")).toBe("/foo/bar");
  });
});

