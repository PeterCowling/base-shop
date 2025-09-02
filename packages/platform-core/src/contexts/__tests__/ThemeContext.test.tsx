import { render } from "@testing-library/react";
import { ThemeProvider, useTheme } from "../ThemeContext";

// React 19 requires this flag for `act` to suppress environment warnings
// when not using a test renderer.
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function ThemeDisplay() {
  const { theme } = useTheme();
  return <span data-testid="theme">{theme}</span>;
}

describe("ThemeProvider fallback", () => {
  const originalLocalStorage = window.localStorage;
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: originalLocalStorage,
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: originalMatchMedia,
    });
    document.documentElement.style.colorScheme = "";
  });

  it("defaults to system/base when APIs are unavailable", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("blocked");
      },
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: undefined,
    });

    const { getByTestId, unmount } = render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>
    );

    expect(getByTestId("theme").textContent).toBe("system");
    expect(document.documentElement.style.colorScheme).toBe("light");

    unmount();
  });
});
