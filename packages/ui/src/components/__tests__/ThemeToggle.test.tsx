import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import ThemeToggle from "../ThemeToggle";

const setThemeMock = vi.fn();

vi.mock("@acme/platform-core/contexts/ThemeContext", () => {
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

  it("renders as a radiogroup with three options", () => {
    render(<ThemeToggle />);

    const radiogroup = screen.getByRole("radiogroup", { name: /theme selection/i });
    expect(radiogroup).toBeInTheDocument();

    const radios = within(radiogroup).getAllByRole("radio");
    expect(radios).toHaveLength(3);
    expect(radios[0]).toHaveAttribute("aria-label", "Light");
    expect(radios[1]).toHaveAttribute("aria-label", "Dark");
    expect(radios[2]).toHaveAttribute("aria-label", "System");
  });

  it("shows Light as selected initially", () => {
    render(<ThemeToggle />);

    const lightButton = screen.getByRole("radio", { name: /light/i });
    expect(lightButton).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText(/light theme selected/i)).toBeInTheDocument();
  });

  it("selects Dark theme on click", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const darkButton = screen.getByRole("radio", { name: /dark/i });
    await user.click(darkButton);

    expect(setThemeMock).toHaveBeenCalledWith("dark");
    expect(darkButton).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText(/dark theme selected/i)).toBeInTheDocument();
  });

  it("selects System theme on click", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const systemButton = screen.getByRole("radio", { name: /system/i });
    await user.click(systemButton);

    expect(setThemeMock).toHaveBeenCalledWith("system");
    expect(systemButton).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText(/system theme selected/i)).toBeInTheDocument();
  });

  it("renders with labels when showLabels is true", () => {
    render(<ThemeToggle showLabels />);

    expect(screen.getByText("Light")).toBeInTheDocument();
    expect(screen.getByText("Dark")).toBeInTheDocument();
    expect(screen.getByText("System")).toBeInTheDocument();
  });

  it("applies size variants correctly", () => {
    const { rerender } = render(<ThemeToggle size="sm" />);
    const radiogroup = screen.getByRole("radiogroup");
    expect(radiogroup).toHaveClass("h-8");

    rerender(<ThemeToggle size="md" />);
    expect(radiogroup).toHaveClass("h-10");
  });
});
