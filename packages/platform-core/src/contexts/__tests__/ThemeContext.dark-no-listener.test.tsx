import React from "react";
import { render } from "@testing-library/react";

import { ThemeProvider } from "../ThemeContext";

import { ThemeDisplay } from "./themeTestUtils";

describe("ThemeContext: dark theme does not register matchMedia listener", () => {
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

  it("does not register matchMedia listener when theme is dark", () => {
    const setItem = jest.fn();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: () => "dark", setItem },
    });

    const addListener = jest.fn();
    const matchMedia = jest
      .fn()
      .mockReturnValue({
        matches: true,
        addEventListener: addListener,
        removeEventListener: jest.fn(),
      } as unknown as MediaQueryList);

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: matchMedia,
    });

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>
    );

    expect(getByTestId("theme").textContent).toBe("dark");
    expect(matchMedia).toHaveBeenCalledTimes(1);
    expect(addListener).not.toHaveBeenCalled();
  });
});

