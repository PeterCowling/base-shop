// packages/platform-core/__tests__/getShopFromPath.test.ts
import { getShopFromPath } from "../utils/getShopFromPath";

describe("getShopFromPath", () => {
  it("extracts shop slug from typical cms paths", () => {
    expect(getShopFromPath("/cms/shop/abc")).toBe("abc");
    expect(getShopFromPath("/cms/shop/abc/products")).toBe("abc");
    expect(getShopFromPath("/cms/shop/abc/pages/new")).toBe("abc");
  });

  it("returns undefined when no shop segment present", () => {
    expect(getShopFromPath("/cms")).toBeUndefined();
    expect(getShopFromPath("/")).toBeUndefined();
  });

  it("ignores duplicate slashes", () => {
    expect(getShopFromPath("/cms//shop//def//products")).toBe("def");
  });
});
