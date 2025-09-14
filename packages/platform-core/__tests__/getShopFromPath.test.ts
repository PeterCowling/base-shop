// packages/platform-core/__tests__/getShopFromPath.test.ts
import { getShopFromPath } from "../src/utils/getShopFromPath";

describe("getShopFromPath", () => {
  it("extracts shop slug from typical cms paths", () => {
    expect(getShopFromPath("/cms/shop/bcd")).toBe("bcd");
    expect(getShopFromPath("/cms/shop/bcd/products")).toBe("bcd");
    expect(getShopFromPath("/cms/shop/bcd/pages/new")).toBe("bcd");
  });

  it("returns undefined when no shop segment present", () => {
    expect(getShopFromPath("/cms")).toBeUndefined();
    expect(getShopFromPath("/")).toBeUndefined();
  });

  it("ignores duplicate slashes", () => {
    expect(getShopFromPath("/cms//shop//def//products")).toBe("def");
  });
});
