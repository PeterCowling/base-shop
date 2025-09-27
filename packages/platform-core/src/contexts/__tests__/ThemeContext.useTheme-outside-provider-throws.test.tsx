import React from "react";
import { render } from "@testing-library/react";
import { useTheme } from "../ThemeContext";

function ThemeDisplay() {
  const { theme } = useTheme();
  return <span data-cy="theme">{theme}</span>;
}

describe("ThemeContext: useTheme outside provider throws", () => {
  it("throws when useTheme is called outside provider", () => {
    expect(() => render(<ThemeDisplay />)).toThrow(
      "useTheme must be inside ThemeProvider"
    );
  });
});

