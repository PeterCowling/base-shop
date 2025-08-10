import { fireEvent, render, screen } from "@testing-library/react";
import ThemeToggle from "../src/components/ThemeToggle";

const setTheme = jest.fn();
let mockTheme = "base";

jest.mock("@platform-core/src/contexts/ThemeContext", () => ({
  useTheme: () => ({ theme: mockTheme, setTheme }),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    setTheme.mockClear();
    mockTheme = "base";
  });

  it("switches label and theme between Dark and Light", () => {
    const { rerender } = render(<ThemeToggle />);

    let button = screen.getByRole("button", { name: /toggle theme/i });
    expect(button).toHaveTextContent("Dark");

    fireEvent.click(button);
    expect(setTheme).toHaveBeenNthCalledWith(1, "dark");

    mockTheme = "dark";
    rerender(<ThemeToggle />);
    button = screen.getByRole("button", { name: /toggle theme/i });
    expect(button).toHaveTextContent("Light");

    fireEvent.click(button);
    expect(setTheme).toHaveBeenNthCalledWith(2, "base");

    mockTheme = "base";
    rerender(<ThemeToggle />);
    button = screen.getByRole("button", { name: /toggle theme/i });
    expect(button).toHaveTextContent("Dark");
  });
});

