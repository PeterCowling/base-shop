import React from "react";
import { render, screen } from "@testing-library/react";

import ThemeToggle from "../src/components/ThemeToggle";

const state: { theme: "base" | "dark" | "system" } = { theme: "base" };
jest.mock("@acme/platform-core/contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: state.theme, setTheme: () => {} }),
}));

describe("ThemeToggle aria-label next theme", () => {
  it("base → dark", () => {
    state.theme = "base";
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      expect.stringMatching(/Switch to Dark theme/i)
    );
  });

  it("dark → system", () => {
    state.theme = "dark";
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      expect.stringMatching(/Switch to System theme/i)
    );
  });

  it("system → base", () => {
    state.theme = "system";
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      expect.stringMatching(/Switch to Light theme/i)
    );
  });
});

