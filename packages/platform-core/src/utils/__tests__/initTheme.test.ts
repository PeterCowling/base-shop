import { initTheme } from "../initTheme";

describe("initTheme", () => {
  const originalLocalStorage = window.localStorage;
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: originalLocalStorage,
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: originalMatchMedia,
    });
    document.documentElement.className = "";
    document.documentElement.style.colorScheme = "";
  });

  it("falls back when localStorage and matchMedia are unavailable", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("blocked");
      },
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: undefined,
    });

    expect(() => {
      // eslint-disable-next-line no-eval
      eval(initTheme);
    }).not.toThrow();
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(document.documentElement.classList.contains("theme-dark")).toBe(
      false
    );
  });
});
