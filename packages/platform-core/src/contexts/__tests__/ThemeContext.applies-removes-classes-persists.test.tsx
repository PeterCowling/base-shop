import React from "react";
import { act, render } from "@testing-library/react";

import { ThemeProvider, useTheme } from "../ThemeContext";

import { ThemeDisplay } from "./themeTestUtils";

describe("ThemeContext: applies/removes classes and persists on change", () => {
  const originalLocalStorage = window.localStorage;

  afterEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: originalLocalStorage,
    });
    document.documentElement.style.colorScheme = "";
    document.documentElement.className = "";
  });

  it("applies/removes classes and persists to localStorage when theme changes", () => {
    const setItem = jest.fn();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: () => null, setItem },
    });

    let changeTheme: (t: any) => void = () => {};
    function CaptureSetter() {
      const { setTheme } = useTheme();
      changeTheme = setTheme;
      return null;
    }

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeDisplay />
        <CaptureSetter />
      </ThemeProvider>
    );
    expect(getByTestId("theme").textContent).toBe("system");
    expect(document.documentElement.className).toBe("");
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(setItem).toHaveBeenCalledWith("theme-mode", "system");
    expect(setItem).toHaveBeenCalledWith("theme-name", "base");
    expect(setItem).toHaveBeenCalledWith("theme", "system");

    act(() => changeTheme("brandx"));
    expect(getByTestId("theme").textContent).toBe("brandx");
    expect(document.documentElement.classList.contains("theme-brandx")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(setItem).toHaveBeenCalledWith("theme-mode", "light");
    expect(setItem).toHaveBeenCalledWith("theme-name", "brandx");
    expect(setItem).toHaveBeenCalledWith("theme", "brandx");

    act(() => changeTheme("dark"));
    expect(getByTestId("theme").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("theme-dark")).toBe(true);
    expect(document.documentElement.classList.contains("theme-brandx")).toBe(false);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(setItem).toHaveBeenCalledWith("theme-mode", "dark");
    expect(setItem).toHaveBeenCalledWith("theme-name", "base");
    expect(setItem).toHaveBeenCalledWith("theme", "dark");

    act(() => changeTheme("base"));
    expect(getByTestId("theme").textContent).toBe("base");
    expect(document.documentElement.className).toBe("");
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(setItem).toHaveBeenCalledWith("theme-mode", "light");
    expect(setItem).toHaveBeenCalledWith("theme-name", "base");
    expect(setItem).toHaveBeenCalledWith("theme", "base");
  });
});
