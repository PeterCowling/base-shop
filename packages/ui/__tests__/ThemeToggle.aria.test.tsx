import React from "react";
import { render, screen } from "@testing-library/react";
import ThemeToggle from "../src/components/ThemeToggle";

const state: { theme: "base" | "dark" | "system" } = { theme: "base" };
jest.mock("@acme/platform-core/contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: state.theme, setTheme: () => {} }),
}));

describe("ThemeToggle aria-live", () => {
  it("announces the current theme (Light)", () => {
    state.theme = "base";
    render(<ThemeToggle />);
    expect(screen.getByText(/Light theme selected/i)).toBeInTheDocument();
  });

  it("announces Dark and System", () => {
    state.theme = "dark";
    render(<ThemeToggle />);
    expect(screen.getByText(/Dark theme selected/i)).toBeInTheDocument();
    state.theme = "system";
    render(<ThemeToggle />);
    expect(screen.getByText(/System theme selected/i)).toBeInTheDocument();
  });
});

