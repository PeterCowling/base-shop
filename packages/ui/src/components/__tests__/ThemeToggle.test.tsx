import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ThemeToggle from "../ThemeToggle";

var setThemeMock: jest.Mock;

jest.mock("@platform-core/contexts/ThemeContext", () => {
  const React = require("react");
  setThemeMock = jest.fn();
  return {
    useTheme: () => {
      const [theme, setThemeState] = React.useState("base");
      const setTheme = (t: string) => {
        setThemeMock(t);
        setThemeState(t);
      };
      return { theme, setTheme };
    },
    setThemeMock,
  };
});

describe("ThemeToggle", () => {
  beforeEach(() => {
    setThemeMock.mockClear();
  });

  it("toggles theme on click", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    const button = screen.getByRole("button", { name: /switch to dark theme/i });
    expect(screen.getByText(/light theme selected/i)).toBeInTheDocument();

    await user.click(button);

    expect(setThemeMock).toHaveBeenCalledWith("dark");
    expect(screen.getByText(/dark theme selected/i)).toBeInTheDocument();
  });

  it.each([
    { key: "Enter", label: /switch to dark theme/i },
    { key: " ", label: /switch to dark theme/i },
  ])("toggles theme on %s key", async ({ key, label }) => {
    const user = userEvent.setup();
    render(<ThemeToggle />);
    const button = screen.getByRole("button", { name: label });

    button.focus();
    await user.keyboard(key === " " ? " " : `{${key}}`);

    expect(setThemeMock).toHaveBeenCalledWith("dark");
    expect(screen.getByText(/dark theme selected/i)).toBeInTheDocument();
  });
});
