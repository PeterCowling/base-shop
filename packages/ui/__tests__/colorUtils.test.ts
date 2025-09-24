import { isHex, isHsl, hslToHex, hexToRgb, getContrastColor, hexToHsl } from "../src/utils/colorUtils";

describe("colorUtils", () => {
  it("validates hex strings", () => {
    expect(isHex("#fff")).toBe(true);
    expect(isHex("#ffffff")).toBe(true);
    expect(isHex("#ff")).toBe(false);
    expect(isHex("fff")).toBe(false);
  });

  it("validates hsl triplets 'h s% l%'", () => {
    expect(isHsl("180 50% 50%")).toBe(true);
    expect(isHsl("180 50 50%")).toBe(false);
    expect(isHsl("180 50% 50")).toBe(false);
    expect(isHsl("bad")).toBe(false);
  });

  it("converts hsl to hex and hex to hsl", () => {
    const hex = hslToHex("0 0% 0%");
    expect(hex).toBe("#000000");
    const hsl = hexToHsl("#000000");
    expect(typeof hsl).toBe("string");
    expect(isHsl(hsl)).toBe(true);
  });

  it("hexToRgb and getContrastColor", () => {
    expect(hexToRgb("#fff")).toEqual([255, 255, 255]);
    expect(getContrastColor("#ffffff")).toBe("var(--color-fg)");
    expect(getContrastColor("#000000")).toBe("var(--color-bg)");
  });
});
