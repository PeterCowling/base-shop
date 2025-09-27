import { JSDOM } from "jsdom";
import { initTheme } from "../src/utils/initTheme";

describe("initTheme", () => {
  function run(theme: string, prefersDark: boolean | undefined = undefined) {
    const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", {
      runScripts: "dangerously",
      url: "https://example.com",
    });
    const { window } = dom;
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: () => theme,
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
    const document = run("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(document.documentElement.classList.contains("theme-dark")).toBe(true);
    expect(document.documentElement.classList.contains("theme-brandx")).toBe(false);
  });

  it("applies brandx theme from storage", () => {
    const document = run("brandx");
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(document.documentElement.classList.contains("theme-dark")).toBe(false);
    expect(document.documentElement.classList.contains("theme-brandx")).toBe(true);
  });

  it("uses system theme with prefers dark", () => {
    const document = run("system", true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(document.documentElement.classList.contains("theme-dark")).toBe(true);
    expect(document.documentElement.classList.contains("theme-brandx")).toBe(false);
  });

  it("uses system theme with prefers light", () => {
    const document = run("system", false);
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(document.documentElement.classList.contains("theme-dark")).toBe(false);
    expect(document.documentElement.classList.contains("theme-brandx")).toBe(false);
  });
});
