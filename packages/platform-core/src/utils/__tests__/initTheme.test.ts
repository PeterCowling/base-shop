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
      // eslint-disable-next-line security/detect-eval-with-expression -- CORE-1013 test executes theme init script string
      eval(initTheme);
    }).not.toThrow();
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(document.documentElement.classList.contains("theme-dark")).toBe(
      false
    );
  });

  it("applies dark theme from localStorage", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: () => "dark",
      },
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: jest.fn(),
    });

    // eslint-disable-next-line security/detect-eval-with-expression -- CORE-1013 test executes theme init script string
    eval(initTheme);

    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(document.documentElement.classList.contains("theme-dark")).toBe(
      true
    );
    expect(document.documentElement.classList.contains("theme-brandx")).toBe(
      false
    );
  });

  it("applies brandx theme from localStorage", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: () => "brandx",
      },
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: jest.fn(),
    });

    // eslint-disable-next-line security/detect-eval-with-expression -- CORE-1013 test executes theme init script string
    eval(initTheme);

    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(document.documentElement.classList.contains("theme-dark")).toBe(
      false
    );
    expect(document.documentElement.classList.contains("theme-brandx")).toBe(
      true
    );
  });

  it("uses system theme with prefers dark", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: () => "system",
      },
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: jest.fn().mockReturnValue({ matches: true }),
    });

    // eslint-disable-next-line security/detect-eval-with-expression -- CORE-1013 test executes theme init script string
    eval(initTheme);

    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(document.documentElement.classList.contains("theme-dark")).toBe(
      true
    );
    expect(document.documentElement.classList.contains("theme-brandx")).toBe(
      false
    );
  });

  it("uses system theme with prefers light", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: () => "system",
      },
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: jest.fn().mockReturnValue({ matches: false }),
    });

    // eslint-disable-next-line security/detect-eval-with-expression -- CORE-1013 test executes theme init script string
    eval(initTheme);

    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(document.documentElement.classList.contains("theme-dark")).toBe(
      false
    );
    expect(document.documentElement.classList.contains("theme-brandx")).toBe(
      false
    );
  });
});
