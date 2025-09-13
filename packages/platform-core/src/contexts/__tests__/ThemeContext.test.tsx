import { act, render } from "@testing-library/react";
import { ThemeProvider, getSavedTheme, getSystemTheme, useTheme } from "../ThemeContext";

// React 19 requires this flag for `act` to suppress environment warnings
// when not using a test renderer.
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

function ThemeDisplay() {
  const { theme } = useTheme();
  return <span data-cy="theme">{theme}</span>;
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

  it("returns null when localStorage.getItem throws", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: jest.fn(() => { throw new Error("fail"); }) },
    });
    expect(getSavedTheme()).toBeNull();
  });

  it("getSystemTheme returns dark when media matches", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({ matches: true }),
    });
    expect(getSystemTheme()).toBe("dark");
  });

  it("getSystemTheme returns base when media does not match", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({ matches: false }),
    });
    expect(getSystemTheme()).toBe("base");
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
    expect(document.documentElement.classList.contains("theme-dark")).toBe(
      true
    );
    expect(setItem).toHaveBeenCalledWith("theme", "system");

    act(() => listener({ matches: false } as MediaQueryListEvent));

    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(document.documentElement.classList.contains("theme-dark")).toBe(
      false
    );
    expect(getByTestId("theme").textContent).toBe("system");
    expect(setItem).toHaveBeenCalledWith("theme", "system");
    expect(setItem).toHaveBeenCalledTimes(2);
  });

  it("does not register matchMedia listener when theme is dark", () => {
    const setItem = jest.fn();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: () => "dark", setItem },
    });

    const addListener = jest.fn();
    const matchMedia = jest
      .fn()
      .mockReturnValue({
        matches: true,
        addEventListener: addListener,
        removeEventListener: jest.fn(),
      } as unknown as MediaQueryList);

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: matchMedia,
    });

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>
    );

    expect(getByTestId("theme").textContent).toBe("dark");
    expect(matchMedia).toHaveBeenCalledTimes(1);
    expect(addListener).not.toHaveBeenCalled();
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
    expect(document.documentElement.className).toBe("");
    expect(document.documentElement.style.colorScheme).toBe("light");

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: "theme", newValue: "dark" })
      );
    });

    expect(getByTestId("theme").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("theme-dark")).toBe(
      true
    );
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(setItem).toHaveBeenCalledWith("theme", "dark");
  });

  it("ignores storage events for other keys", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: () => "base", setItem: jest.fn() },
    });

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>
    );

    expect(getByTestId("theme").textContent).toBe("base");

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: "other", newValue: "dark" })
      );
    });

    expect(getByTestId("theme").textContent).toBe("base");
  });

  it("ignores storage events with null newValue", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: () => "base", setItem: jest.fn() },
    });

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeDisplay />
      </ThemeProvider>
    );

    expect(getByTestId("theme").textContent).toBe("base");

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: "theme", newValue: null })
      );
    });

    expect(getByTestId("theme").textContent).toBe("base");
  });

  it("applies/removes classes and persists to localStorage when theme changes", () => {
    const setItem = jest.fn();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: () => null, setItem },
    });

    let changeTheme: (t: any) => void = () => {};
    function CaptureSetter() {
      const { setTheme } = useTheme();
      changeTheme = setTheme;
      return null;
    }

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeDisplay />
        <CaptureSetter />
      </ThemeProvider>
    );
    expect(getByTestId("theme").textContent).toBe("system");
    expect(document.documentElement.className).toBe("");
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(setItem).toHaveBeenLastCalledWith("theme", "system");

    act(() => changeTheme("brandx"));
    expect(getByTestId("theme").textContent).toBe("brandx");
    expect(document.documentElement.classList.contains("theme-brandx")).toBe(
      true
    );
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(setItem).toHaveBeenLastCalledWith("theme", "brandx");

    act(() => changeTheme("dark"));
    expect(getByTestId("theme").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("theme-dark")).toBe(
      true
    );
    expect(document.documentElement.classList.contains("theme-brandx")).toBe(
      false
    );
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(setItem).toHaveBeenLastCalledWith("theme", "dark");

    act(() => changeTheme("base"));
    expect(getByTestId("theme").textContent).toBe("base");
    expect(document.documentElement.className).toBe("");
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(setItem).toHaveBeenLastCalledWith("theme", "base");
  });

  it("removes theme class and uses light scheme when switching to base", () => {
    const setItem = jest.fn((_, value) => {
      if (value === "base") {
        throw new Error("fail");
      }
    });
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: { getItem: () => "dark", setItem },
    });

    let changeTheme: (t: any) => void = () => {};
    function CaptureSetter() {
      const { setTheme } = useTheme();
      changeTheme = setTheme;
      return null;
    }

    const { getByTestId } = render(
      <ThemeProvider>
        <ThemeDisplay />
        <CaptureSetter />
      </ThemeProvider>
    );

    expect(getByTestId("theme").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("theme-dark")).toBe(true);
    expect(document.documentElement.style.colorScheme).toBe("dark");

    expect(() => act(() => changeTheme("base"))).not.toThrow();

    expect(getByTestId("theme").textContent).toBe("base");
    expect(document.documentElement.className).toBe("");
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(setItem).toHaveBeenLastCalledWith("theme", "base");
  });

  it("still renders when localStorage.setItem throws", () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: () => null,
        setItem: () => {
          throw new Error("fail");
        },
      },
    });

    expect(() =>
      render(
        <ThemeProvider>
          <ThemeDisplay />
        </ThemeProvider>
      )
    ).not.toThrow();
  });

  it("throws when useTheme is called outside provider", () => {
    expect(() => render(<ThemeDisplay />)).toThrow(
      "useTheme must be inside ThemeProvider"
    );
  });

  it("throws when hook invoked directly", () => {
    const orig = console.error;
    console.error = () => {};
    expect(() => useTheme()).toThrow();
    console.error = orig;
  });
});
