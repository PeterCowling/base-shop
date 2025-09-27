import React from "react";
import { act, render } from "@testing-library/react";
import { ThemeProvider, useTheme } from "../ThemeContext";
import { ThemeDisplay } from "./themeTestUtils";

describe("ThemeContext: switching to base removes class and sets light scheme", () => {
  const originalLocalStorage = window.localStorage;

  afterEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: originalLocalStorage,
    });
    document.documentElement.style.colorScheme = "";
    document.documentElement.className = "";
  });

  it("removes theme class and uses light scheme when switching to base", () => {
    const setItem = jest.fn((_, value) => {
      if (value === "base") {
        throw new Error("fail");
      }
    });
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: () => "dark", setItem },
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

    expect(getByTestId("theme").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("theme-dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");

    expect(() => act(() => changeTheme("base"))).not.toThrow();

    expect(getByTestId("theme").textContent).toBe("base");
    expect(document.documentElement.className).toBe("");
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(setItem).toHaveBeenLastCalledWith("theme", "base");
  });
});

