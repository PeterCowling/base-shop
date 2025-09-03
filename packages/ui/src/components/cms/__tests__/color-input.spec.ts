import {
  colorToRgb,
  hslToRgb,
  luminance,
  suggestContrastColor,
  getContrast,
} from "../ColorInput";

describe("colorToRgb", () => {
  it("handles hex input", () => {
    expect(colorToRgb("#fff")).toEqual([255, 255, 255]);
  });

  it("handles HSL input", () => {
    expect(colorToRgb("0 0% 100%"))
      .toEqual([255, 255, 255]);
  });
});

describe("luminance", () => {
  it("uses the low-channel formula for small values", () => {
    expect(luminance([10, 10, 10])).toBeCloseTo(0.003, 3);
  });

  it("uses the high-channel formula for larger values", () => {
    expect(luminance([100, 100, 100])).toBeCloseTo(0.127, 3);
  });
});

describe("hslToRgb", () => {
  const cases: Array<[number, [number, number, number]]> = [
    [0, [255, 0, 0]],
    [60, [255, 255, 0]],
    [120, [0, 255, 0]],
    [180, [0, 255, 255]],
    [240, [0, 0, 255]],
    [300, [255, 0, 255]],
  ];

  it.each(cases)("converts %s° correctly", (hue, expected) => {
    expect(hslToRgb(`${hue} 100% 50%`)).toEqual(expected);
  });
});

describe("suggestContrastColor", () => {
  it("returns a new color meeting the requested ratio", () => {
    const base = "#000000";
    const suggestion = suggestContrastColor(base, base, 4.5);
    expect(suggestion).not.toBeNull();
    if (suggestion) {
      expect(suggestion).not.toBe(base);
      expect(getContrast(suggestion, base)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("returns null when no adjustment can satisfy the ratio", () => {
    expect(suggestContrastColor("#ffffff", "#ffffff", 4.5)).toBeNull();
  });
});

describe("getContrast", () => {
  it("matches expected ratio for known color pairs", () => {
    expect(getContrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(getContrast("0 0% 0%", "0 0% 100%"))
      .toBeCloseTo(21, 5);
  });
});
