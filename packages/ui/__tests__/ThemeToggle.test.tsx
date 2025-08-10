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

  it("cycles themes and updates ARIA attributes", () => {
    const { rerender } = render(<ThemeToggle />);

    let button = screen.getByRole("button", { name: /toggle theme/i });
    let live = screen.getByText(/light theme selected/i);
    expect(live).toHaveAttribute("aria-live", "polite");
    expect(button).toHaveTextContent("Dark");
    expect(button).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(button);
    expect(setTheme).toHaveBeenNthCalledWith(1, "dark");

    mockTheme = "dark";
    rerender(<ThemeToggle />);
    button = screen.getByRole("button", { name: /toggle theme/i });
    live = screen.getByText(/dark theme selected/i);
    expect(button).toHaveTextContent("System");
    expect(button).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(button);
    expect(setTheme).toHaveBeenNthCalledWith(2, "system");

    mockTheme = "system";
    rerender(<ThemeToggle />);
    button = screen.getByRole("button", { name: /toggle theme/i });
    live = screen.getByText(/system theme selected/i);
    expect(button).toHaveTextContent("Light");
    expect(button).toHaveAttribute("aria-pressed", "mixed");

    fireEvent.click(button);
    expect(setTheme).toHaveBeenNthCalledWith(3, "base");
  });
});

