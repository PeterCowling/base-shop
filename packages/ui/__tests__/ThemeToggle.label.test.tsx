import React from "react";
import { render, screen } from "@testing-library/react";

import ThemeToggle from "../src/components/ThemeToggle";

const state: { mode: "light" | "dark" | "system" } = { mode: "light" };
jest.mock("@acme/platform-core/contexts/ThemeModeContext", () => ({
  useThemeMode: () => ({ mode: state.mode, setMode: () => {} }),
}));

describe("ThemeToggle aria-label next theme", () => {
  it("light → dark", () => {
    state.mode = "light";
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      expect.stringMatching(/Switch to Dark theme/i)
    );
  });

  it("dark → system", () => {
    state.mode = "dark";
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      expect.stringMatching(/Switch to System theme/i)
    );
  });

  it("system → base", () => {
    state.mode = "system";
    render(<ThemeToggle />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      expect.stringMatching(/Switch to Light theme/i)
    );
  });
});
