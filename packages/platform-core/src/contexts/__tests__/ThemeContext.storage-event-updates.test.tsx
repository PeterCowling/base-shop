import React from "react";
import { act, render } from "@testing-library/react";
import { ThemeProvider } from "../ThemeContext";
import { ThemeDisplay } from "./themeTestUtils";

describe("ThemeContext: storage event updates theme", () => {
  const originalLocalStorage = window.localStorage;

  afterEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: originalLocalStorage,
    });
    document.documentElement.style.colorScheme = "";
    document.documentElement.className = "";
  });

  it("updates when storage event dispatched", () => {
    const setItem = jest.fn();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: () => "base", setItem },
    });

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>
    );

    expect(getByTestId("theme").textContent).toBe("base");
    expect(document.documentElement.className).toBe("");
    expect(document.documentElement.style.colorScheme).toBe("light");

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: "theme", newValue: "dark" })
      );
    });

    expect(getByTestId("theme").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("theme-dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(setItem).toHaveBeenCalledWith("theme", "dark");
  });
});

