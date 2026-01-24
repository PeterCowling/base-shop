import { JSDOM } from "jsdom";

import { initTheme } from "../src/utils/initTheme";

describe("initTheme", () => {
  function run(
    { mode, name, legacy }: { mode?: string; name?: string; legacy?: string },
    prefersDark: boolean | undefined = undefined
  ) {
    const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", {
      runScripts: "dangerously",
      url: "https://example.com",
    });
    const { window } = dom;
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: (key: string) => {
          if (key === "theme-mode") return mode ?? null;
          if (key === "theme-name") return name ?? null;
          if (key === "theme") return legacy ?? null;
          return null;
        },
      },
      configurable: true,
    });
    Object.defineProperty(window, "matchMedia", {
      value: jest.fn().mockReturnValue({ matches: prefersDark ?? false }),
      configurable: true,
    });
    window.eval(initTheme);
    return dom.window.document;
  }

  it("applies dark theme from storage", () => {
    const document = run({ mode: "dark" });
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(document.documentElement.classList.contains("theme-dark")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("theme-brandx")).toBe(false);
  });

  it("applies brandx theme from storage", () => {
    const document = run({ name: "brandx" });
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(document.documentElement.classList.contains("theme-dark")).toBe(false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.classList.contains("theme-brandx")).toBe(true);
  });

  it("uses system theme with prefers dark", () => {
    const document = run({ mode: "system" }, true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(document.documentElement.classList.contains("theme-dark")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("theme-brandx")).toBe(false);
  });

  it("uses system theme with prefers light", () => {
    const document = run({ mode: "system" }, false);
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(document.documentElement.classList.contains("theme-dark")).toBe(false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.classList.contains("theme-brandx")).toBe(false);
  });
});
