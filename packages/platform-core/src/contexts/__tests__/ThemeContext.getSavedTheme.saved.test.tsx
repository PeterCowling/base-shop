import { getSavedTheme } from "../ThemeContext";

describe("ThemeContext.getSavedTheme: saved value", () => {
  const originalLocalStorage = window.localStorage;

  afterEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: originalLocalStorage,
    });
    document.documentElement.style.colorScheme = "";
    document.documentElement.className = "";
  });

  it("reads saved theme when available", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: jest.fn().mockReturnValue("dark") },
    });
    expect(getSavedTheme()).toBe("dark");
  });
});

