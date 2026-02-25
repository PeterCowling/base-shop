import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ThemeModeSwitch } from "@/components/ThemeModeSwitch";

function installMatchMedia(matches: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mediaQueries = new Set<MediaQueryList>();
  let current = matches;

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: jest.fn().mockImplementation((query: string) => {
      const mql: MediaQueryList = {
        matches: current,
        media: query,
        onchange: null,
        addEventListener: (_event: string, callback: (event: MediaQueryListEvent) => void) => {
          listeners.add(callback);
        },
        removeEventListener: (
          _event: string,
          callback: (event: MediaQueryListEvent) => void
        ) => {
          listeners.delete(callback);
        },
        dispatchEvent: () => true,
      };
      mediaQueries.add(mql);
      return mql;
    }),
  });

  return {
    setMatches(next: boolean) {
      current = next;
      mediaQueries.forEach((mql) => {
        Object.defineProperty(mql, "matches", {
          configurable: true,
          writable: true,
          value: next,
        });
      });
      const event = { matches: next } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };
}

describe("ThemeModeSwitch", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("theme-dark");
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "";
  });

  it("allows manual light/dark override from automatic mode", async () => {
    installMatchMedia(true);

    render(<ThemeModeSwitch />);

    await waitFor(() => {
      expect(document.documentElement.classList.contains("theme-dark")).toBe(true);
    });

    fireEvent.click(screen.getByRole("radio", { name: "Switch to light mode" }));

    expect(window.localStorage.getItem("theme-mode")).toBe("light");
    expect(document.documentElement.classList.contains("theme-dark")).toBe(false);
    expect(
      screen.getByRole("button", { name: "Return to automatic mode" })
    ).toBeInTheDocument();
  });

  it("restores automatic mode and follows system preference", async () => {
    const media = installMatchMedia(true);
    window.localStorage.setItem("theme-mode", "dark");

    render(<ThemeModeSwitch />);

    await waitFor(() => {
      expect(document.documentElement.classList.contains("theme-dark")).toBe(true);
    });

    fireEvent.click(screen.getByRole("button", { name: "Return to automatic mode" }));

    expect(window.localStorage.getItem("theme-mode")).toBe("system");
    expect(document.documentElement.classList.contains("theme-dark")).toBe(true);

    act(() => {
      media.setMatches(false);
    });

    await waitFor(() => {
      expect(document.documentElement.classList.contains("theme-dark")).toBe(false);
    });
  });
});
