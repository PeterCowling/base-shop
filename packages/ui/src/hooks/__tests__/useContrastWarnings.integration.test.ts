import { renderHook } from "@testing-library/react";
import useContrastWarnings from "../useContrastWarnings";

// i18n-exempt: test names
describe("useContrastWarnings (integration with CSS vars)", () => {
  beforeEach(() => {
    document.documentElement.style.removeProperty("--color-fg");
    document.documentElement.style.removeProperty("--color-bg");
  });

  // i18n-exempt: test name
  it("returns warning when CSS var-based colors have low contrast", () => {
    document.documentElement.style.setProperty("--color-fg", "0 0% 50%");
    document.documentElement.style.setProperty("--color-bg", "0 0% 50%");
    const fg = `hsl(${document.documentElement.style.getPropertyValue("--color-fg")})`;
    const bg = `hsl(${document.documentElement.style.getPropertyValue("--color-bg")})`;
    const { result } = renderHook(() => useContrastWarnings(fg, bg));
    expect(result.current).not.toBeNull();
    expect(result.current?.contrast).toBeLessThan(4.5);
  });

  // i18n-exempt: test name
  it("returns null when CSS var-based colors meet contrast threshold", () => {
    document.documentElement.style.setProperty("--color-fg", "0 0% 100%");
    document.documentElement.style.setProperty("--color-bg", "0 0% 0%");
    const fg = `hsl(${document.documentElement.style.getPropertyValue("--color-fg")})`;
    const bg = `hsl(${document.documentElement.style.getPropertyValue("--color-bg")})`;
    const { result } = renderHook(() => useContrastWarnings(fg, bg));
    expect(result.current).toBeNull();
  });
});
