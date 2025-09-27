import React from "react";
import { render } from "@testing-library/react";
import { ThemeProvider } from "../ThemeContext";
import { ThemeDisplay } from "./themeTestUtils";

describe("ThemeContext: still renders when localStorage.setItem throws", () => {
  const originalLocalStorage = window.localStorage;

  afterEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: originalLocalStorage,
    });
    document.documentElement.style.colorScheme = "";
    document.documentElement.className = "";
  });

  it("still renders when localStorage.setItem throws", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: () => null,
        setItem: () => {
          throw new Error("fail");
        },
      },
    });

    expect(() =>
      render(
        <ThemeProvider>
          <ThemeDisplay />
        </ThemeProvider>
      )
    ).not.toThrow();
  });
});

