import { getShopFromPath } from "@acme/platform-core/utils/getShopFromPath";

describe("getShopFromPath (core)", () => {
  it("extracts from path segments", () => {
    expect(getShopFromPath("/cms/shop/demo/pages")).toBe("demo");
  });

  it("handles duplicate slashes and trailing", () => {
    expect(getShopFromPath("/cms//shop//demo//")).toBe("demo");
  });

  it("returns undefined when slug absent", () => {
    expect(getShopFromPath("/cms/shop")).toBeUndefined();
    expect(getShopFromPath("/cms/pages?shop=")).toBeUndefined();
  });
});
