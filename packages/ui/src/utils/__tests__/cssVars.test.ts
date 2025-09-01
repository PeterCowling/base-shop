import { cssVars } from "../style";

describe("cssVars", () => {
  it("maps color overrides to CSS variables", () => {
    const vars = cssVars({
      color: { bg: "--bg", fg: "--fg", border: "--border" },
    });
    expect(vars).toEqual({
      "--color-bg": "var(--bg)",
      "--color-fg": "var(--fg)",
      "--color-border": "var(--border)",
    });
  });

  it("maps typography overrides to CSS variables", () => {
    const vars = cssVars({
      typography: {
        fontFamily: "--font-family",
        fontSize: "--font-size",
        fontWeight: "--font-weight",
        lineHeight: "--line-height",
      },
    });
    expect(vars).toEqual({
      "--font-family": "var(--font-family)",
      "--font-size": "var(--font-size)",
      "--font-weight": "var(--font-weight)",
      "--line-height": "var(--line-height)",
    });
  });
});
