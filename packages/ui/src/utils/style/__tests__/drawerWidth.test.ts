import { drawerWidthProps } from "../drawerWidth";

describe("drawerWidthProps", () => {
  it("returns widthClass for tailwind input", () => {
    const result = drawerWidthProps("w-64");
    expect(result).toEqual({ widthClass: "w-64", style: undefined });
  });

  it("returns style for numeric width", () => {
    const result = drawerWidthProps(250);
    expect(result.widthClass).toBeUndefined();
    expect(result.style).toEqual({ width: 250 });
  });

  it("handles percentage width string", () => {
    expect(drawerWidthProps("50%")).toEqual({
      widthClass: undefined,
      style: { width: "50%" },
    });
  });
});
