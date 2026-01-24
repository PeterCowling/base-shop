import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ThemeToggle from "../ThemeToggle";

const setThemeMock = jest.fn();

jest.mock("@acme/platform-core/contexts/ThemeModeContext", () => {
  const React = require("react");
  return {
    useThemeMode: () => {
      const [mode, setModeState] = React.useState("light");
      const setMode = (t: string) => {
        setThemeMock(t);
        setModeState(t);
      };
      return { mode, setMode };
    },
  };
});

describe("ThemeToggle", () => {
  beforeEach(() => {
    setThemeMock.mockClear();
  });

  it("renders a toggle button", () => {
    render(<ThemeToggle />);

    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("aria-label", expect.stringContaining("theme"));
  });

  it("cycles to next theme on click", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const button = screen.getByRole("button");
    await user.click(button);

    // From "light", next theme should be "dark"
    expect(setThemeMock).toHaveBeenCalledWith("dark");
  });
});
