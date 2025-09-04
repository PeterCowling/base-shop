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
  it("computes contrast for hex and HSL colors", () => {
    const ratio = getContrast("#000000", "0 0% 100%");
    expect(ratio).toBeCloseTo(21, 5);
  });
});

describe("suggestContrastColor", () => {
  it("returns an adjusted color when possible", () => {
    const reference = "#000000";
    const suggestion = suggestContrastColor("#000000", reference, 4.5);
    expect(suggestion).not.toBeNull();
    if (suggestion) {
      expect(getContrast(suggestion, reference)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("returns null for unreachable contrast ratios", () => {
    const suggestion = suggestContrastColor("#000000", "#ffffff", 22);
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
});

describe("hslToRgb", () => {
  it.each([
    ["30 100% 50%", [255, 128, 0]],
    ["90 100% 50%", [128, 255, 0]],
    ["150 100% 50%", [0, 255, 128]],
    ["210 100% 50%", [0, 128, 255]],
    ["270 100% 50%", [128, 0, 255]],
    ["330 100% 50%", [255, 0, 128]],
  ])("converts %s to %p", (hsl, expected) => {
    expect(hslToRgb(hsl)).toEqual(expected);
  });
});

describe("colorToRgb", () => {
  it("delegates to hexToRgb for hex colors", () => {
    expect(colorToRgb("#fff")).toEqual(hexToRgb("#fff"));
  });

  it("delegates to hslToRgb for hsl colors", () => {
    expect(colorToRgb("0 0% 0%")).toEqual(hslToRgb("0 0% 0%"));
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
});

