
import "@testing-library/jest-dom";

import { initTheme } from "@acme/platform-core/utils";

type RunScriptOptions = {
  prefersDark?: boolean;
  hasMatchMedia?: boolean;
  matchMediaThrows?: boolean;
};

function runScript({
  prefersDark = false,
  hasMatchMedia = true,
  matchMediaThrows = false,
}: RunScriptOptions): void {
  if (hasMatchMedia) {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: jest.fn().mockImplementation((query: string) => {
        if (matchMediaThrows) {
          throw new Error("matchMedia not available");
        }

        return {
          matches: prefersDark,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        };
      }),
    });
  } else {
    delete (window as unknown as Record<string, unknown>).matchMedia;
  }

  new Function(initTheme)();
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
  jest.restoreAllMocks();
});

describe("initTheme", () => {
  it("applies the stored dark theme", () => {
    localStorage.setItem("theme-mode", "dark");
    runScript({ prefersDark: false });
    expect(document.documentElement.classList.contains("theme-dark")).toBe(true);
  });

  it("applies the stored light theme even if prefers dark", () => {
    localStorage.setItem("theme-mode", "light");
    runScript({ prefersDark: true });
    expect(document.documentElement.classList.contains("theme-dark")).toBe(false);
  });

  it("applies dark theme if no stored theme and prefers-color-scheme is dark", () => {
    runScript({ prefersDark: true });
    expect(document.documentElement.classList.contains("theme-dark")).toBe(true);
  });

  it("applies light theme if no stored theme and prefers-color-scheme is light", () => {
    runScript({ prefersDark: false });
    expect(document.documentElement.classList.contains("theme-dark")).toBe(false);
  });

  it("defaults to light when matchMedia is missing", () => {
    runScript({ hasMatchMedia: false });
    expect(document.documentElement.classList.contains("theme-dark")).toBe(false);
  });

  it("defaults to light when matchMedia throws", () => {
    runScript({ matchMediaThrows: true });
    expect(document.documentElement.classList.contains("theme-dark")).toBe(false);
  });

  it("outputs a self-invoking script string", () => {
    const script = initTheme;
    expect(typeof script).toBe("string");
    expect(script).toMatch(/^\s*\(function\s\(\)/);
    expect(script).toContain("localStorage.getItem");
    expect(script).toContain("window.matchMedia");
  });
});
