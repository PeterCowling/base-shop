import { cssVars } from "../cssVars";
import { boxProps } from "../boxProps";
import { drawerWidthProps } from "../drawerWidth";

describe("style utils", () => {
  it("cssVars maps color and typography tokens to CSS vars", () => {
    const vars = cssVars({
      color: { bg: "--bg", fg: "--fg", border: "--bd" },
      typography: { fontFamily: "--ff", fontSize: "--fs", fontWeight: "--fw", lineHeight: "--lh" },
      typographyMobile: { fontSize: "--fsm", lineHeight: "--lhm" },
      effects: { borderRadius: "4px", transformRotate: "10deg", transformScale: "1.1" },
    } as any);
    expect(vars["--color-bg"]).toBe("var(--bg)");
    expect(vars["--color-fg"]).toBe("var(--fg)");
    expect(vars["--color-border"]).toBe("var(--bd)");
    expect(vars["--font-family"]).toBe("var(--ff)");
    expect(vars["--font-size"]).toBe("var(--fs)");
    expect(vars["--font-weight"]).toBe("var(--fw)");
    expect(vars["--line-height"]).toBe("var(--lh)");
    expect(vars["--font-size-mobile"]).toBe("var(--fsm)");
    expect(vars["--line-height-mobile"]).toBe("var(--lhm)");
    expect(vars["borderRadius"]).toBe("4px");
    expect(vars["--pb-static-transform"]).toContain("rotate(10deg)");
    expect(vars["--pb-static-transform"]).toContain("scale(1.1)");
  });

  it("boxProps returns classes for tailwind width/height tokens and style for raw values", () => {
    const a = boxProps({ width: "w-4", height: "h-2", padding: "p-2", margin: "mt-1" });
    expect(a.classes).toContain("w-4");
    expect(a.classes).toContain("h-2");
    expect(a.classes).toContain("p-2");
    expect(a.classes).toContain("mt-1");
    expect(a.style).toEqual({});

    const b = boxProps({ width: 300, height: "200px" });
    expect(b.classes).toBe("");
    expect(b.style).toEqual({ width: 300, height: "200px" });
  });

  it("drawerWidthProps returns width class or inline style depending on input", () => {
    expect(drawerWidthProps("w-64")).toEqual({ widthClass: "w-64", style: undefined });
    expect(drawerWidthProps(320)).toEqual({ widthClass: undefined, style: { width: 320 } });
  });
});
