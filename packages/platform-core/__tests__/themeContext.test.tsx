import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { ThemeProvider, useTheme } from "../src/contexts/ThemeContext";

function Buttons() {
  const { setTheme } = useTheme();
  return (
    <div>
      <button onClick={() => setTheme("dark")}>dark</button>
      <button onClick={() => setTheme("brandx")}>brandx</button>
    </div>
  );
}

describe("ThemeContext", () => {
  beforeAll(() => {
    // jsdom doesn't implement matchMedia, but our context expects it.
    // Provide a minimal stub so effects don't error during tests.
    window.matchMedia =
      window.matchMedia ||
      ((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      } as unknown as MediaQueryList));
  });

  afterEach(() => {
    document.documentElement.className = "";
    localStorage.clear();
  });

  it("applies classes to <html> element", async () => {
    render(
      <ThemeProvider>
        <Buttons />
      </ThemeProvider>
    );

    const html = document.documentElement;
    expect(html.className).toBe("");
    fireEvent.click(await screen.findByText("dark"));
    expect(html.classList.contains("theme-dark")).toBe(true);
    fireEvent.click(await screen.findByText("brandx"));
    expect(html.classList.contains("theme-dark")).toBe(false);
    expect(html.classList.contains("theme-brandx")).toBe(true);
  });

  it("matches snapshot on initial render", async () => {
    const { asFragment } = render(
      <ThemeProvider>
        <div>Hello</div>
      </ThemeProvider>
    );
    await screen.findByText("Hello");
    expect(asFragment()).toMatchSnapshot();
  });
});
