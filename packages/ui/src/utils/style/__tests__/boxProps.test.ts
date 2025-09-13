import { boxProps } from "../boxProps";

describe("boxProps", () => {
  it("returns empty classes and style when no props provided", () => {
    expect(boxProps({})).toEqual({ classes: "", style: {} });
  });

  it("returns class when only tailwind width provided", () => {
    expect(boxProps({ width: "w-10" })).toEqual({ classes: "w-10", style: {} });
  });

  it("uses style when only numeric width provided", () => {
    expect(boxProps({ width: 100 })).toEqual({ classes: "", style: { width: 100 } });
  });

  it("returns class when only tailwind height provided", () => {
    expect(boxProps({ height: "h-8" })).toEqual({ classes: "h-8", style: {} });
  });

  it("uses style when only numeric height provided", () => {
    expect(boxProps({ height: 50 })).toEqual({ classes: "", style: { height: 50 } });
  });

  it("returns classes for tailwind width/height", () => {
    const result = boxProps({
      width: "w-16",
      height: "h-32",
      padding: "p-2",
      margin: "m-3",
    });
    expect(result).toEqual({ classes: "w-16 h-32 p-2 m-3", style: {} });
  });

  it("uses style for numeric or non-tailwind values", () => {
    const result = boxProps({ width: 200, height: "100%" });
    expect(result.classes).toBe("");
    expect(result.style).toEqual({ width: 200, height: "100%" });
  });

  it("uses style for percentage width values", () => {
    const result = boxProps({ width: "50%" });
    expect(result.classes).toBe("");
    expect(result.style.width).toBe("50%");
  });

  it("drops unknown properties", () => {
    const result = boxProps({ width: "w-4", foo: "bar" } as any);
    expect(result).toEqual({ classes: "w-4", style: {} });
  });

  it("supports responsive utility classes", () => {
    const result = boxProps({ padding: "md:p-4" });
    expect(result.classes).toBe("md:p-4");
  });

  it("aggregates padding class when only padding provided", () => {
    expect(boxProps({ padding: "p-4" })).toEqual({ classes: "p-4", style: {} });
  });

  it("aggregates margin class when only margin provided", () => {
    expect(boxProps({ margin: "m-2" })).toEqual({ classes: "m-2", style: {} });
  });

  it("mixes class and style when only one dimension uses tailwind", () => {
    const result = boxProps({ width: "w-4", height: 20 });
    expect(result).toEqual({ classes: "w-4", style: { height: 20 } });
  });
});
