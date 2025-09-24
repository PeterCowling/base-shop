// packages/ui/src/utils/style/__tests__/boxProps.test.ts
import { boxProps } from "../boxProps";

describe("boxProps", () => {
  test("returns classes for tailwind width/height and padding/margin", () => {
    const { classes, style } = boxProps({
      width: "w-full",
      height: "md:h-40",
      padding: "p-4",
      margin: "mt-2",
    });
    expect(classes).toContain("w-full");
    expect(classes).toContain("md:h-40");
    expect(classes).toContain("p-4");
    expect(classes).toContain("mt-2");
    expect(style).toEqual({});
  });

  test("returns inline styles for numeric or raw width/height", () => {
    const { classes, style } = boxProps({ width: 320, height: "40vh" });
    expect(classes).toBe("");
    expect(style).toEqual({ width: 320, height: "40vh" });
  });
});

