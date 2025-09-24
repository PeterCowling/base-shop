import { cssVars } from "../src/utils/style/cssVars";

describe("cssVars utility", () => {
  it("returns empty object when no overrides", () => {
    expect(cssVars(undefined)).toEqual({});
  });

  it("maps color and typography tokens to CSS vars", () => {
    const vars = cssVars({
      color: { bg: "--bg", fg: "--fg", border: "--border" },
      typography: {
        fontFamily: "--ff",
        fontSize: "--fs",
        fontWeight: "--fw",
        lineHeight: "--lh",
      },
      typographyDesktop: { fontSize: "--fs-d", lineHeight: "--lh-d" },
      typographyTablet: { fontSize: "--fs-t", lineHeight: "--lh-t" },
      typographyMobile: { fontSize: "--fs-m", lineHeight: "--lh-m" },
    } as any);

    expect(vars).toMatchObject({
      "--color-bg": "var(--bg)",
      "--color-fg": "var(--fg)",
      "--color-border": "var(--border)",
      "--font-family": "var(--ff)",
      "--font-size": "var(--fs)",
      "--font-weight": "var(--fw)",
      "--line-height": "var(--lh)",
      "--font-size-desktop": "var(--fs-d)",
      "--line-height-desktop": "var(--lh-d)",
      "--font-size-tablet": "var(--fs-t)",
      "--line-height-tablet": "var(--lh-t)",
      "--font-size-mobile": "var(--fs-m)",
      "--line-height-mobile": "var(--lh-m)",
    });
  });

  it("maps effects to style properties and composes transforms", () => {
    const vars = cssVars({
      effects: {
        borderRadius: "8px",
        boxShadow: "0 1px 2px rgba(0,0,0,.2)",
        opacity: "0.9",
        backdropFilter: "blur(4px)",
        filter: "contrast(120%)",
        outline: "1px solid red",
        outlineOffset: "2px",
        borderTop: "1px solid #000",
        borderRight: "2px solid #111",
        borderBottom: "3px solid #222",
        borderLeft: "4px solid #333",
        transformRotate: "15deg",
        transformScale: "1.1",
        transformSkewX: "5deg",
        transformSkewY: "-3deg",
      },
    } as any);

    expect(vars).toMatchObject({
      borderRadius: "8px",
      boxShadow: "0 1px 2px rgba(0,0,0,.2)",
      opacity: "0.9",
      backdropFilter: "blur(4px)",
      filter: "contrast(120%)",
      outline: "1px solid red",
      outlineOffset: "2px",
      borderTop: "1px solid #000",
      borderRight: "2px solid #111",
      borderBottom: "3px solid #222",
      borderLeft: "4px solid #333",
      "--pb-static-transform": expect.stringContaining("rotate(15deg)"),
    });
    expect(vars["--pb-static-transform"]).toContain("scale(1.1)");
    expect(vars["--pb-static-transform"]).toContain("skewX(5deg)");
    expect(vars["--pb-static-transform"]).toContain("skewY(-3deg)");
  });
});

