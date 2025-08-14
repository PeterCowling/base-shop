import { hslToHex, hexToHsl, isHex, isHsl } from "../colorUtils";

describe("colorUtils", () => {
  test("hslToHex converts HSL to hex", () => {
    expect(hslToHex("0 100% 50%")).toBe("#ff0000");
  });

  test("hexToHsl converts hex to HSL", () => {
    expect(hexToHsl("#00ff00")).toBe("120 100% 50%");
  });

  test("isHex validates hex colors", () => {
    expect(isHex("#fff")).toBe(true);
    expect(isHex("fff")).toBe(false);
  });

  test("isHsl validates HSL colors", () => {
    expect(isHsl("120 100% 50%")).toBe(true);
    expect(isHsl("#fff")).toBe(false);
  });
});
