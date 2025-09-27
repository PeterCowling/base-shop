import { getSystemTheme } from "../ThemeContext";

describe("ThemeContext.getSystemTheme: dark when matches", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: originalMatchMedia,
    });
    document.documentElement.style.colorScheme = "";
    document.documentElement.className = "";
  });

  it("getSystemTheme returns dark when media matches", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({ matches: true }),
    });
    expect(getSystemTheme()).toBe("dark");
  });
});

