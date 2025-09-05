import { validateShopName } from "../validateShopName";

describe("validateShopName", () => {
  it("returns trimmed name", () => {
    expect(validateShopName(" my-shop ")).toBe("my-shop");
  });

  it.each(["", "   "])("throws for empty input %p", (input) => {
    expect(() => validateShopName(input)).toThrow();
  });

  it("throws on names longer than 63 characters", () => {
    expect(() => validateShopName("a".repeat(64))).toThrow();
  });

  it("throws on illegal characters", () => {
    expect(() => validateShopName("shop#name")).toThrow();
  });

  it("accepts 63-character names", () => {
    const name = "a".repeat(63);
    expect(validateShopName(` ${name} `)).toBe(name);
  });
});
