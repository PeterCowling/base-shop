import { validateShopName } from "../validateShopName";

describe("validateShopName", () => {
  it("trims leading and trailing spaces", () => {
    expect(validateShopName(" my-shop ")).toBe("my-shop");
  });

  it("throws on empty or whitespace-only input", () => {
    expect(() => validateShopName("")).toThrow();
    expect(() => validateShopName("   ")).toThrow();
  });

  it("throws on 64-character input", () => {
    expect(() => validateShopName("a".repeat(64))).toThrow();
  });

  it("throws on illegal characters", () => {
    expect(() => validateShopName("shop#name")).toThrow();
  });
});
