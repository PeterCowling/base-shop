// packages/platform-core/__tests__/shops.test.ts
import { validateShopName } from "../shops";

describe("validateShopName", () => {
  it("trims and accepts safe names", () => {
    expect(validateShopName("  store_1 ")).toBe("store_1");
  });

  it("throws for invalid characters", () => {
    expect(() => validateShopName("bad/name")).toThrow("Invalid shop name");
  });
});
