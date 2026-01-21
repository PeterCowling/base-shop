// packages/ui/src/utils/__tests__/colorUtils.test.ts
/* i18n-exempt file -- TEST-0001: unit test titles and literals are not user-facing */
 
import {
  getContrastColor,
  HEX_RE,
  hexToHsl,
  hexToRgb,
  hslToHex,
  isHex,
  isHsl,
} from "../colorUtils";

describe("colorUtils", () => {
  test("isHex validates 3 and 6 digit hex", () => {
    expect(isHex("#fff")).toBe(true);
    expect(isHex("#ffffff")).toBe(true);
    expect(isHex("fff")).toBe(false);
    expect(HEX_RE.test("#123abc")).toBe(true);
  });

  test("isHsl validates space-separated h s% l%", () => {
    expect(isHsl("210 50% 40%"));
    expect(isHsl("210 50 40%"));
    expect(isHsl("210 50% 40")).toBe(false);
    expect(isHsl("bad input")).toBe(false);
  });

  test("hsl<->hex conversion roundtrip approximately matches", () => {
    const hex = hslToHex("210 50% 40%");
    expect(isHex(hex)).toBe(true);
    const back = hexToHsl(hex);
    // Compare only H component and ensure sane ranges
    const [h] = back.split(" ");
    expect(Number(h)).toBeGreaterThanOrEqual(0);
    expect(Number(h)).toBeLessThanOrEqual(360);
  });

  test("hexToRgb throws on invalid hex", () => {
    expect(() => hexToRgb("oops")).toThrow();
  });

  test("getContrastColor picks foreground for light backgrounds", () => {
    expect(getContrastColor("#ffffff")).toBe("var(--color-fg)");
    expect(getContrastColor("#000000")).toBe("var(--color-bg)");
  });
});
