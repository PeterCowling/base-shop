import { fireEvent, render } from "@testing-library/react";

import { ThemeModeProvider, useThemeMode } from "@acme/platform-core/contexts/ThemeModeContext";

function Toggle() {
  const { mode, setMode } = useThemeMode();
  return (
    <button onClick={() => setMode(mode === "dark" ? "light" : "dark")} data-cy="toggle">
      {mode}
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
    window.localStorage.setItem("theme-mode", "dark");
    render(
      <ThemeModeProvider>
        <Toggle />
      </ThemeModeProvider>
    );
    expect(document.documentElement.classList.contains("theme-dark")).toBe(true);
  });

  it("toggles theme, applies class and persists to localStorage", () => {
    const { getByTestId } = render(
      <ThemeModeProvider>
        <Toggle />
      </ThemeModeProvider>
    );
    fireEvent.click(getByTestId("toggle"));
    expect(document.documentElement.classList.contains("theme-dark")).toBe(true);
    expect(window.localStorage.getItem("theme-mode")).toBe("dark");
  });
});
