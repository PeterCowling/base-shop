import { fireEvent, render, screen } from "@testing-library/react";

import { ThemeProvider, useTheme } from "@acme/platform-core/contexts/ThemeContext";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function Display() {
  const { theme, setTheme } = useTheme();
  return (
    <>
      <span data-cy="theme">{theme}</span>
      <button onClick={() => setTheme("dark")}>dark</button>
    </>
  );
}

describe("ThemeContext", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.style.colorScheme = "";
    window.matchMedia =
      window.matchMedia ||
      ((q: string) => ({
        matches: false,
        media: q,
        addEventListener: () => {},
        removeEventListener: () => {},
      })) as any;
    jest.restoreAllMocks();
  });

  it("defaults to system and toggles to dark with persistence", () => {
    const spy = jest.spyOn(Storage.prototype, "setItem");
    render(
      <ThemeProvider>
        <Display />
      </ThemeProvider>
    );

    const span = screen.getByTestId("theme");
    expect(span.textContent).toBe("system");
    fireEvent.click(screen.getByText("dark"));
    expect(span.textContent).toBe("dark");
    expect(document.documentElement.classList.contains("theme-dark")).toBe(true);
    expect(spy).toHaveBeenLastCalledWith("theme", "dark");
  });

  it("uses saved theme from localStorage", () => {
    localStorage.setItem("theme", "brandx");
    render(
      <ThemeProvider>
        <Display />
      </ThemeProvider>
    );
    expect(screen.getByTestId("theme").textContent).toBe("brandx");
    expect(document.documentElement.classList.contains("theme-brandx")).toBe(true);
  });

  it("throws when useTheme called outside provider", () => {
    const orig = console.error;
    console.error = () => {};
    function Bare() {
      useTheme();
      return null;
    }
    expect(() => render(<Bare />)).toThrow(
      "useTheme must be inside ThemeProvider"
    );
    console.error = orig;
  });
});
