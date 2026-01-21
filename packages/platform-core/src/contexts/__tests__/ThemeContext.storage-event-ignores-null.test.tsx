import React from "react";
import { act, render } from "@testing-library/react";

import { ThemeProvider } from "../ThemeContext";

import { ThemeDisplay } from "./themeTestUtils";

describe("ThemeContext: ignores storage events with null newValue", () => {
  const originalLocalStorage = window.localStorage;

  afterEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: originalLocalStorage,
    });
    document.documentElement.style.colorScheme = "";
    document.documentElement.className = "";
  });

  it("ignores storage events with null newValue", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: () => "base", setItem: jest.fn() },
    });

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>
    );

    expect(getByTestId("theme").textContent).toBe("base");

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: "theme", newValue: null })
      );
    });

    expect(getByTestId("theme").textContent).toBe("base");
  });
});

