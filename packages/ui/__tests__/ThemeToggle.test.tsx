import React from "react";
import { fireEvent,render, screen } from "@testing-library/react";

import ThemeToggle from "../src/components/ThemeToggle";

const state: { mode: "light" | "dark" | "system" } = { mode: "light" };
const setModeMock = jest.fn((next: string) => {
  // update mock state so repeated renders can observe changes if needed
  state.mode = next as any;
});

jest.mock("@acme/platform-core/contexts/ThemeModeContext", () => ({
  useThemeMode: () => ({ mode: state.mode, setMode: setModeMock }),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    state.mode = "light";
    setModeMock.mockClear();
  });

  it("cycles to next theme on click", () => {
    render(<ThemeToggle />);
    // light -> dark
    fireEvent.click(screen.getByRole("button"));
    expect(setModeMock).toHaveBeenCalledWith("dark");
  });

  it("cycles on Enter keydown", () => {
    state.mode = "dark"; // dark -> system
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    fireEvent.keyDown(btn, { key: "Enter" });
    expect(setModeMock).toHaveBeenCalledWith("system");
  });

  it("cycles on Space keydown", () => {
    state.mode = "system"; // system -> light
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    fireEvent.keyDown(btn, { key: " " });
    expect(setModeMock).toHaveBeenCalledWith("light");
  });
});
