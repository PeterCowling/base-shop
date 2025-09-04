import { getShopFromPath } from "./getShopFromPath";

describe("getShopFromPath", () => {
  it("returns the shop slug even with extra slashes", () => {
    expect(getShopFromPath("/cms//shop/demo///pages")).toBe("demo");
  });

  it("returns undefined when the shop segment is missing", () => {
    expect(getShopFromPath("/cms/foo/bar")).toBeUndefined();
  });

  it("returns undefined for null or undefined inputs", () => {
    expect(getShopFromPath(null)).toBeUndefined();
    expect(getShopFromPath(undefined)).toBeUndefined();
  });
});
