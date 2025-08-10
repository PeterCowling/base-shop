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

  it("offers Light, Dark, and System options", () => {
    render(<ThemeToggle />);

    const select = screen.getByRole("combobox", { name: /theme/i });
    expect(select).toHaveValue("base");

    fireEvent.change(select, { target: { value: "dark" } });
    expect(setTheme).toHaveBeenNthCalledWith(1, "dark");

    fireEvent.change(select, { target: { value: "system" } });
    expect(setTheme).toHaveBeenNthCalledWith(2, "system");

    fireEvent.change(select, { target: { value: "base" } });
    expect(setTheme).toHaveBeenNthCalledWith(3, "base");
  });
});

