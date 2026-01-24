import React from "react";
import { render, screen } from "@testing-library/react";

import ThemeToggle from "../src/components/ThemeToggle";

const state: { mode: "light" | "dark" | "system" } = { mode: "light" };
jest.mock("@acme/platform-core/contexts/ThemeModeContext", () => ({
  useThemeMode: () => ({ mode: state.mode, setMode: () => {} }),
}));

describe("ThemeToggle aria-live", () => {
  it("announces the current theme (Light)", () => {
    state.mode = "light";
    render(<ThemeToggle />);
    expect(screen.getByText(/Light theme selected/i)).toBeInTheDocument();
  });

  it("announces Dark and System", () => {
    state.mode = "dark";
    render(<ThemeToggle />);
    expect(screen.getByText(/Dark theme selected/i)).toBeInTheDocument();
    state.mode = "system";
    render(<ThemeToggle />);
    expect(screen.getByText(/System theme selected/i)).toBeInTheDocument();
  });
});
