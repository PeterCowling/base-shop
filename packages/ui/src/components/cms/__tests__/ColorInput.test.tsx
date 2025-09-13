import { render, fireEvent } from "@testing-library/react";
import * as CI from "../ColorInput";

const {
  ColorInput,
  getContrast,
  suggestContrastColor,
  hexToRgb,
  hslToRgb,
  colorToRgb,
  luminance,
} = CI;

describe("getContrast", () => {
  it("matches expected ratio for known color pairs", () => {
    expect(getContrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(getContrast("0 0% 0%", "0 0% 100%"))
      .toBeCloseTo(21, 5);
  });
});

describe("suggestContrastColor", () => {
  it("returns an adjusted hex color when possible", () => {
    const reference = "#000000";
    const suggestion = suggestContrastColor("#000000", reference, 4.5);
    expect(suggestion).not.toBeNull();
    if (suggestion) {
      expect(suggestion).not.toBe(reference);
      expect(suggestion.startsWith("#")).toBe(true);
      expect(getContrast(suggestion, reference)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("returns an adjusted HSL color when possible", () => {
    const reference = "0 0% 0%";
    const suggestion = suggestContrastColor("0 0% 0%", reference, 4.5);
    expect(suggestion).not.toBeNull();
    if (suggestion) {
      expect(suggestion).not.toBe(reference);
      expect(suggestion.startsWith("#")).toBe(false);
      expect(getContrast(suggestion, reference)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("darkens a lighter color and exits once contrast is sufficient", () => {
    const reference = "#000000";
    const suggestion = suggestContrastColor("#ffffff", reference, 4.5);
    expect(suggestion).toBe("#f2f2f2");
    if (suggestion) {
      expect(getContrast(suggestion, reference)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("returns null after exhausting iteration limit for very high ratios", () => {
    const suggestion = suggestContrastColor("#000000", "#ffffff", 100);
    expect(suggestion).toBeNull();
  });

  it("returns null when luminance adjustment exceeds bounds", () => {
    const suggestion = suggestContrastColor("0 0% 98%", "#000000", 100);
    expect(suggestion).toBeNull();
  });

  it("returns null when color is at maximum luminance", () => {
    const suggestion = suggestContrastColor("#ffffff", "#ffffff", 4.5);
    expect(suggestion).toBeNull();
  });
});

describe("ColorInput component", () => {
  it("converts hex input to HSL and triggers onChange", () => {
    const handleChange = jest.fn();
    const { container } = render(
      <ColorInput value="0 100% 50%" onChange={handleChange} />
    );

    const input = container.querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "#00ff00" } });
    expect(handleChange).toHaveBeenCalledWith("120 100% 50%");
  });
});

describe("hexToRgb", () => {
  it("handles 3-character hex codes", () => {
    expect(hexToRgb("#abc")).toEqual([170, 187, 204]);
  });

  it("handles 6-character hex codes", () => {
    expect(hexToRgb("#aabbcc")).toEqual([170, 187, 204]);
  });
});

describe("hslToRgb", () => {
  const cases: Array<[string, [number, number, number]]> = [
    ["0 100% 50%", [255, 0, 0]],
    ["30 100% 50%", [255, 128, 0]],
    ["60 100% 50%", [255, 255, 0]],
    ["90 100% 50%", [128, 255, 0]],
    ["120 100% 50%", [0, 255, 0]],
    ["150 100% 50%", [0, 255, 128]],
    ["180 100% 50%", [0, 255, 255]],
    ["210 100% 50%", [0, 128, 255]],
    ["240 100% 50%", [0, 0, 255]],
    ["270 100% 50%", [128, 0, 255]],
    ["300 100% 50%", [255, 0, 255]],
    ["330 100% 50%", [255, 0, 128]],
  ];

  it.each(cases)("converts %s to %p", (hsl, expected) => {
    expect(hslToRgb(hsl)).toEqual(expected);
  });
});

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
  it.each([
    [[0, 0, 0], 0],
    [[255, 255, 255], 1],
    [[255, 0, 0], 0.2126],
  ])("computes luminance for %p", (rgb, expected) => {
    expect(luminance(rgb as [number, number, number])).toBeCloseTo(expected, 5);
  });

  it("uses the low-channel formula for small values", () => {
    expect(luminance([10, 10, 10])).toBeCloseTo(0.003, 3);
  });

  it("uses the high-channel formula for larger values", () => {
    expect(luminance([100, 100, 100])).toBeCloseTo(0.127, 3);
  });
});

