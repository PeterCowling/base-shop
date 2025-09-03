import { act, render } from "@testing-library/react";
import { ThemeProvider, getSavedTheme, getSystemTheme, useTheme } from "../ThemeContext";

// React 19 requires this flag for `act` to suppress environment warnings
// when not using a test renderer.
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function ThemeDisplay() {
  const { theme } = useTheme();
  return <span data-testid="theme">{theme}</span>;
}

describe("ThemeContext", () => {
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
    document.documentElement.className = "";
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

  it("reads saved theme when available", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: jest.fn().mockReturnValue("dark") },
    });
    expect(getSavedTheme()).toBe("dark");
  });

  it("returns null when saved theme missing", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: jest.fn().mockReturnValue(null) },
    });
    expect(getSavedTheme()).toBeNull();
  });

  it("falls back to base when matchMedia throws", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => {
        throw new Error("no media");
      },
    });

    expect(getSystemTheme()).toBe("base");
  });

  it("uses system matchMedia and reacts to changes", () => {
    const setItem = jest.fn();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: () => null, setItem },
    });

    let listener: (e: MediaQueryListEvent) => void = () => {};
    const mql = {
      matches: true,
      addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => {
        listener = cb;
      },
      removeEventListener: jest.fn(),
    } as unknown as MediaQueryList;

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: jest.fn().mockReturnValue(mql),
    });

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>
    );

    expect(getByTestId("theme").textContent).toBe("system");
    expect(document.documentElement.style.colorScheme).toBe("dark");

    act(() => listener({ matches: false } as MediaQueryListEvent));

    expect(document.documentElement.style.colorScheme).toBe("light");
  });

  it("updates when storage event dispatched", () => {
    const setItem = jest.fn();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: () => "base", setItem },
    });

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>
    );

    expect(getByTestId("theme").textContent).toBe("base");

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: "theme", newValue: "dark" })
      );
    });

    expect(getByTestId("theme").textContent).toBe("dark");
    expect(setItem).toHaveBeenCalledWith("theme", "dark");
  });

  it("throws when useTheme is called outside provider", () => {
    expect(() => render(<ThemeDisplay />)).toThrow(
      "useTheme must be inside ThemeProvider"
    );
  });
});
