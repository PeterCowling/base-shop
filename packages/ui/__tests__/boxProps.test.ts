import { boxProps } from "../src/utils/style/boxProps";

describe("boxProps", () => {
  it("returns utility classes for tailwind-like width/height and padding/margin", () => {
    const res = boxProps({ width: "w-10", height: "md:h-20", padding: "p-4", margin: "m-2" });
    expect(res.classes).toContain("w-10");
    expect(res.classes).toContain("md:h-20");
    expect(res.classes).toContain("p-4");
    expect(res.classes).toContain("m-2");
    expect(res.style.width).toBeUndefined();
    expect(res.style.height).toBeUndefined();
  });

  it("returns inline styles when given numeric or non-utility width/height", () => {
    const res = boxProps({ width: 100, height: "200px" });
    expect(res.classes).toBe("");
    expect(res.style.width).toBe(100);
    expect(res.style.height).toBe("200px");
  });
});

