// packages/ui/src/utils/style/__tests__/drawerWidth.test.ts
import { drawerWidthProps } from "../drawerWidth";

describe("drawerWidthProps", () => {
  test("returns class when width is tailwind class string", () => {
    const out = drawerWidthProps("w-64");
    expect(out.widthClass).toBe("w-64");
    expect(out.style).toBeUndefined();
  });

  test("returns style when width is number", () => {
    const out = drawerWidthProps(320);
    expect(out.widthClass).toBeUndefined();
    expect(out.style).toEqual({ width: 320 });
  });
});

