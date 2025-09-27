import { getSavedTheme } from "../ThemeContext";

describe("ThemeContext.getSavedTheme: localStorage throws", () => {
  const originalLocalStorage = window.localStorage;

  afterEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: originalLocalStorage,
    });
    document.documentElement.style.colorScheme = "";
    document.documentElement.className = "";
  });

  it("returns null when localStorage.getItem throws", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: jest.fn(() => { throw new Error("fail"); }) },
    });
    expect(getSavedTheme()).toBeNull();
  });
});

