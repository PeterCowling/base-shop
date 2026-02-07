import React from "react";
import { act, render } from "@testing-library/react";

import { ThemeProvider } from "../ThemeContext";

import { ThemeDisplay } from "./themeTestUtils";

describe("ThemeContext: uses system and reacts to changes", () => {
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
    document.documentElement.style.colorScheme = "";
    document.documentElement.className = "";
  });

  it("uses system matchMedia and reacts to changes", () => {
    const setItem = jest.fn();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: () => null, setItem },
    });

    let listener: (e: MediaQueryListEvent) => void = () => {};
    const mql = {
      matches: true,
      addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => {
        listener = cb;
      },
      removeEventListener: jest.fn(),
    } as unknown as MediaQueryList;

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: jest.fn().mockReturnValue(mql),
    });

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>
    );

    expect(getByTestId("theme").textContent).toBe("system");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(document.documentElement.classList.contains("theme-dark")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(setItem).toHaveBeenCalledWith("theme-mode", "system");
    expect(setItem).toHaveBeenCalledWith("theme-name", "base");
    expect(setItem).toHaveBeenCalledWith("theme", "system");

    act(() => listener({ matches: false } as MediaQueryListEvent));

    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(document.documentElement.classList.contains("theme-dark")).toBe(false);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(getByTestId("theme").textContent).toBe("system");
    expect(setItem).toHaveBeenCalledWith("theme-mode", "system");
    expect(setItem).toHaveBeenCalledWith("theme-name", "base");
    expect(setItem).toHaveBeenCalledWith("theme", "system");
  });
});
