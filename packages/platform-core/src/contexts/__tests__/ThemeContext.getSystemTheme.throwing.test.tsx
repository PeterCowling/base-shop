import { getSystemTheme } from "../ThemeContext";

describe("ThemeContext.getSystemTheme: throws -> base", () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: originalMatchMedia,
    });
    document.documentElement.style.colorScheme = "";
    document.documentElement.className = "";
  });

  it("falls back to base when matchMedia throws", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => {
        throw new Error("no media");
      },
    });

    expect(getSystemTheme()).toBe("base");
  });
});

