import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ThemeToggle from "../src/components/ThemeToggle";

const state: { theme: "base" | "dark" | "system" } = { theme: "base" };
const setThemeMock = jest.fn((next: string) => {
  // update mock state so repeated renders can observe changes if needed
  state.theme = next as any;
});

jest.mock("@acme/platform-core/contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: state.theme, setTheme: setThemeMock }),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    state.theme = "base";
    setThemeMock.mockClear();
  });

  it("cycles to next theme on click", () => {
    render(<ThemeToggle />);
    // base -> dark
    fireEvent.click(screen.getByRole("button"));
    expect(setThemeMock).toHaveBeenCalledWith("dark");
  });

  it("cycles on Enter keydown", () => {
    state.theme = "dark"; // dark -> system
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    fireEvent.keyDown(btn, { key: "Enter" });
    expect(setThemeMock).toHaveBeenCalledWith("system");
  });

  it("cycles on Space keydown", () => {
    state.theme = "system"; // system -> base
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    fireEvent.keyDown(btn, { key: " " });
    expect(setThemeMock).toHaveBeenCalledWith("base");
  });
});
