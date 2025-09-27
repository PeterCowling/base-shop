import { getSavedTheme } from "../ThemeContext";

describe("ThemeContext.getSavedTheme: missing value", () => {
  const originalLocalStorage = window.localStorage;

  afterEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: originalLocalStorage,
    });
    document.documentElement.style.colorScheme = "";
    document.documentElement.className = "";
  });

  it("returns null when saved theme missing", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: jest.fn().mockReturnValue(null) },
    });
    expect(getSavedTheme()).toBeNull();
  });
});

