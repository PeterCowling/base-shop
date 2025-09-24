import { drawerWidthProps } from "../src/utils/style/drawerWidth";

describe("drawerWidthProps", () => {
  it("returns utility class when width is tailwind-like", () => {
    const res = drawerWidthProps("w-64");
    expect(res.widthClass).toBe("w-64");
    expect(res.style).toBeUndefined();
  });

  it("returns style object when width is number or non-utility string", () => {
    const res1 = drawerWidthProps(320);
    expect(res1.widthClass).toBeUndefined();
    expect(res1.style).toEqual({ width: 320 });

    const res2 = drawerWidthProps("320px");
    expect(res2.widthClass).toBeUndefined();
    expect(res2.style).toEqual({ width: "320px" });
  });
});

