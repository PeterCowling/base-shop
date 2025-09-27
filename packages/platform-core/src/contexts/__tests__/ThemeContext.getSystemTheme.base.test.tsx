import { getSystemTheme } from "../ThemeContext";

describe("ThemeContext.getSystemTheme: base when not matching", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: originalMatchMedia,
    });
    document.documentElement.style.colorScheme = "";
    document.documentElement.className = "";
  });

  it("getSystemTheme returns base when media does not match", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({ matches: false }),
    });
    expect(getSystemTheme()).toBe("base");
  });
});

