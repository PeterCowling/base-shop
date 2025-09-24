// packages/ui/src/utils/style/__tests__/cssVars.test.ts
import { cssVars } from "../cssVars";

describe("cssVars", () => {
  test("returns empty object when no overrides provided", () => {
    expect(cssVars()).toEqual({});
  });

  test("maps color and typography overrides to CSS custom properties", () => {
    const out = cssVars({
      color: { bg: "--color-bg-1", fg: "--color-fg", border: "--color-border" },
      typography: {
        fontFamily: "--font-body",
        fontSize: "--font-size-1",
        fontWeight: "--font-weight-1",
        lineHeight: "--line-height-1",
      },
      typographyDesktop: { fontSize: "--font-size-2", lineHeight: "--line-height-2" },
      typographyTablet: { fontSize: "--font-size-3", lineHeight: "--line-height-3" },
      typographyMobile: { fontSize: "--font-size-4", lineHeight: "--line-height-4" },
    } as any);

    expect(out).toMatchObject({
      "--color-bg": "var(--color-bg-1)",
      "--color-fg": "var(--color-fg)",
      "--color-border": "var(--color-border)",
      "--font-family": "var(--font-body)",
      "--font-size": "var(--font-size-1)",
      "--font-weight": "var(--font-weight-1)",
      "--line-height": "var(--line-height-1)",
      "--font-size-desktop": "var(--font-size-2)",
      "--line-height-desktop": "var(--line-height-2)",
      "--font-size-tablet": "var(--font-size-3)",
      "--line-height-tablet": "var(--line-height-3)",
      "--font-size-mobile": "var(--font-size-4)",
      "--line-height-mobile": "var(--line-height-4)",
    });
  });

  test("maps effects fields including composed transform", () => {
    const out = cssVars({
      effects: {
        borderRadius: "8px",
        boxShadow: "0 0 0 1px red",
        opacity: "0.9",
        backdropFilter: "blur(4px)",
        outline: "2px solid",
        outlineOffset: "2px",
        borderTop: "1px solid",
        borderRight: "1px solid",
        borderBottom: "1px solid",
        borderLeft: "1px solid",
        transformRotate: "10deg",
        transformScale: "1.1",
        transformSkewX: "2deg",
        transformSkewY: "-1deg",
      },
    } as any);

    expect(out).toMatchObject({
      borderRadius: "8px",
      boxShadow: "0 0 0 1px red",
      opacity: "0.9",
      backdropFilter: "blur(4px)",
      outline: "2px solid",
      outlineOffset: "2px",
      borderTop: "1px solid",
      borderRight: "1px solid",
      borderBottom: "1px solid",
      borderLeft: "1px solid",
      "--pb-static-transform": expect.stringContaining("rotate(10deg)"),
    });
    expect(out["--pb-static-transform"]).toContain("scale(1.1)");
    expect(out["--pb-static-transform"]).toContain("skewX(2deg)");
    expect(out["--pb-static-transform"]).toContain("skewY(-1deg)");
  });
});

