import { fireEvent, render, screen } from "@testing-library/react";
import ThemeToggle from "../src/components/ThemeToggle";

const setTheme = jest.fn();
let mockTheme: string = "base";

jest.mock("@platform-core/src/contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: mockTheme, setTheme }),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    setTheme.mockClear();
    mockTheme = "base";
  });

  it("cycles through themes and announces changes", () => {
    const { rerender } = render(<ThemeToggle />);

    let button = screen.getByRole("button", {
      name: /switch to dark theme/i,
    });
    let live = screen.getByText(/light theme selected/i);
    expect(live).toHaveAttribute("aria-live", "polite");

    fireEvent.click(button);
    expect(setTheme).toHaveBeenNthCalledWith(1, "dark");

    mockTheme = "dark";
    rerender(<ThemeToggle />);

    button = screen.getByRole("button", {
      name: /switch to system theme/i,
    });
    live = screen.getByText(/dark theme selected/i);

    fireEvent.keyDown(button, { key: "Enter" });
    expect(setTheme).toHaveBeenNthCalledWith(2, "system");

    mockTheme = "system";
    rerender(<ThemeToggle />);

    button = screen.getByRole("button", {
      name: /switch to light theme/i,
    });
    live = screen.getByText(/system theme selected/i);

    fireEvent.keyDown(button, { key: " " });
    expect(setTheme).toHaveBeenNthCalledWith(3, "base");
  });
});

