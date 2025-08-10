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

  it("selects themes and updates ARIA attributes", () => {
    const { rerender } = render(<ThemeToggle />);

    const group = screen.getByRole("radiogroup", { name: /theme/i });
    expect(group).toBeInTheDocument();

    let light = screen.getByLabelText("Light");
    let dark = screen.getByLabelText("Dark");
    let system = screen.getByLabelText("System");
    let live = screen.getByText(/light theme selected/i);

    expect(live).toHaveAttribute("aria-live", "polite");
    expect(light).toBeChecked();
    expect(light).toHaveAttribute("aria-checked", "true");

    fireEvent.click(dark);
    expect(setTheme).toHaveBeenNthCalledWith(1, "dark");

    mockTheme = "dark";
    rerender(<ThemeToggle />);
    light = screen.getByLabelText("Light");
    dark = screen.getByLabelText("Dark");
    system = screen.getByLabelText("System");
    live = screen.getByText(/dark theme selected/i);
    expect(dark).toBeChecked();
    expect(dark).toHaveAttribute("aria-checked", "true");

    fireEvent.click(system);
    expect(setTheme).toHaveBeenNthCalledWith(2, "system");

    mockTheme = "system";
    rerender(<ThemeToggle />);
    light = screen.getByLabelText("Light");
    dark = screen.getByLabelText("Dark");
    system = screen.getByLabelText("System");
    live = screen.getByText(/system theme selected/i);
    expect(system).toBeChecked();
    expect(system).toHaveAttribute("aria-checked", "true");

    fireEvent.click(light);
    expect(setTheme).toHaveBeenNthCalledWith(3, "base");
  });
});

