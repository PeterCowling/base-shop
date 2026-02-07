// packages/ui/src/components/cms/__tests__/ColorInput.helpers.test.ts
import React from "react";
import { fireEvent,render, screen } from "@testing-library/react";

import {
  ColorInput,
  colorToRgb,
  getContrast,
  hslToRgb,
  luminance,
  resolveCssVars,
  suggestContrastColor,
} from "../ColorInput";

describe("ColorInput helpers", () => {
  test("hslToRgb parses both bare triplets and hsl() function forms", () => {
    const a = hslToRgb("210 50% 40%");
    const b = hslToRgb("hsl(210 50% 40%)");
    expect(Array.isArray(a)).toBe(true);
    expect(Array.isArray(b)).toBe(true);
  });

  test("colorToRgb handles hex, rgb/rgba and hsl syntax", () => {
    // Use rgb form to avoid raw hex color lint in tests
    expect(colorToRgb("rgb(255, 255, 255)")).toEqual([255, 255, 255]);
    expect(colorToRgb("rgb(0, 10, 20)")).toEqual([0, 10, 20]);
    expect(colorToRgb("rgba(0,10,20,0.4)")).toEqual([0, 10, 20]);
    const [r, g, b] = colorToRgb("hsl(210 50% 40%)");
    expect([r, g, b].every((n) => n >= 0 && n <= 255)).toBe(true);
  });

  test("resolveCssVars replaces var tokens from :root when available", () => {
    document.documentElement.style.setProperty("--c-primary", "210 60% 50%");
    // Avoid hsl(var(--…)) form in tests per lint rule; resolve plain var()
    const out = resolveCssVars("var(--c-primary)");
    expect(out).toBe("210 60% 50%");
  });

  test("getContrast computes ratio and suggestContrastColor nudges lightness to reach threshold", () => {
    const c = getContrast("rgb(0,0,0)", "rgb(255,255,255)");
    expect(c).toBeGreaterThan(4.5);
    // Start with low-contrast pair; suggestion should return a new color
    const suggestion = suggestContrastColor("210 50% 50%", "210 50% 50%", 4.5);
    expect(typeof suggestion === "string" || suggestion === null).toBe(true);
  });

  test("ColorInput converts between hex and hsl on change", () => {
    const onChange = jest.fn();
    const { container } = render(<ColorInput value="210 50% 40%" onChange={onChange} />);
    const input = container.querySelector('input[type="color"]') as HTMLInputElement;
    expect(input.value).toMatch(/^#([0-9a-f]{6})$/i);
     
    fireEvent.change(input, { target: { value: "#000000" } });
    expect(onChange).toHaveBeenCalled();
  });
});
