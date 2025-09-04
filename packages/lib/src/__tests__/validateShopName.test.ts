// @ts-nocheck
import { validateShopName } from "../validateShopName";

describe("validateShopName", () => {
  it("trims leading and trailing spaces", () => {
    expect(validateShopName(" myshop ")).toBe("myshop");
  });

  it("allows underscores and dashes", () => {
    expect(validateShopName("my_shop")).toBe("my_shop");
    expect(validateShopName("my-shop")).toBe("my-shop");
  });

  it("rejects spaces or non-ascii characters", () => {
    expect(() => validateShopName("shop name")).toThrow();
    expect(() => validateShopName("caf\u00E9")).toThrow();
  });

  it("rejects empty or overly long names", () => {
    expect(() => validateShopName("")).toThrow();
    expect(() => validateShopName("a".repeat(65))).toThrow();
  });
});
