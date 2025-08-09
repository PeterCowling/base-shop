import { fireEvent, render } from "@testing-library/react";
import { ThemeProvider } from "@platform-core/src/contexts/ThemeContext";
import ThemeToggle from "../src/components/ThemeToggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    document.documentElement.className = "";
    localStorage.clear();
  });

  it("toggles between base and dark themes", () => {
    const { getByRole } = render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const toggle = getByRole("checkbox");
    fireEvent.click(toggle);
    expect(document.documentElement.classList.contains("theme-dark")).toBe(true);
    expect(localStorage.getItem("PREFERRED_THEME")).toBe("dark");
    fireEvent.click(toggle);
    expect(document.documentElement.classList.contains("theme-dark")).toBe(false);
    expect(localStorage.getItem("PREFERRED_THEME")).toBe("base");
  });
});
