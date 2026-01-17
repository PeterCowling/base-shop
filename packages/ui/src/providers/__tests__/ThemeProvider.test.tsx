import React from "react";
import { act, render } from "@testing-library/react";

import { ThemeProvider } from "../ThemeProvider";
import { useTheme } from "../../hooks/useTheme";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe("UI ThemeProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
  });

  it("toggles theme-dark on the document element", () => {
    let setTheme: (next: "light" | "dark") => void = () => {};

    function CaptureSetter() {
      const { setTheme: setThemeFromHook } = useTheme();
      setTheme = setThemeFromHook;
      return null;
    }

    render(
      <ThemeProvider>
        <CaptureSetter />
      </ThemeProvider>
    );

    act(() => setTheme("dark"));
    expect(document.documentElement.classList.contains("theme-dark")).toBe(true);

    act(() => setTheme("light"));
    expect(document.documentElement.classList.contains("theme-dark")).toBe(false);
  });
});
