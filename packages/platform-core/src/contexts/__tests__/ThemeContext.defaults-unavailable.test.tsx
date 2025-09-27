import React from "react";
import { render } from "@testing-library/react";
import { ThemeProvider } from "../ThemeContext";
import { ThemeDisplay } from "./themeTestUtils";

describe("ThemeContext: defaults when APIs unavailable", () => {
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

  it("defaults to system/base when APIs are unavailable", () => {
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

    const { getByTestId, unmount } = render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>
    );

    expect(getByTestId("theme").textContent).toBe("system");
    expect(document.documentElement.style.colorScheme).toBe("light");

    unmount();
  });
});

