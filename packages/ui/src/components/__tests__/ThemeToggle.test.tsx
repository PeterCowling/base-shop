import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ThemeToggle from "../ThemeToggle";

const setThemeMock = jest.fn();

jest.mock("@acme/platform-core/contexts/ThemeContext", () => {
  const React = require("react");
  return {
    useTheme: () => {
      const [theme, setThemeState] = React.useState("base");
      const setTheme = (t: string) => {
        setThemeMock(t);
        setThemeState(t);
      };
      return { theme, setTheme };
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

    // From "base", next theme should be "dark"
    expect(setThemeMock).toHaveBeenCalledWith("dark");
  });
});
