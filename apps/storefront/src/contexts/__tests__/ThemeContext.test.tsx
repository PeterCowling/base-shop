import { fireEvent, render } from "@testing-library/react";
import { ThemeProvider, useTheme } from "../../../../../packages/platform-core/src/contexts/ThemeContext";

function Toggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button onClick={() => setTheme(theme === "dark" ? "base" : "dark")} data-cy="toggle">
      {theme}
    </button>
  );
}

beforeEach(() => {
  document.documentElement.className = "";
  document.documentElement.style.colorScheme = "";
  window.localStorage.clear();
});

describe("ThemeContext", () => {
  it("restores theme from localStorage on mount", () => {
    window.localStorage.setItem("theme", "dark");
    render(
      <ThemeProvider>
        <Toggle />
      </ThemeProvider>
    );
    expect(document.documentElement.classList.contains("theme-dark")).toBe(true);
  });

  it("toggles theme, applies class and persists to localStorage", () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <Toggle />
      </ThemeProvider>
    );
    fireEvent.click(getByTestId("toggle"));
    expect(document.documentElement.classList.contains("theme-dark")).toBe(true);
    expect(window.localStorage.getItem("theme")).toBe("dark");
  });
});

