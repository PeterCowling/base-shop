import { hexToRgb, getContrastColor } from "../src/utils/colorUtils";

describe("hexToRgb", () => {
  it("converts 6-digit hex to RGB", () => {
    expect(hexToRgb("#123456")).toEqual([18, 52, 86]);
  });

  it("supports short hex values", () => {
    expect(hexToRgb("#abc")).toEqual([170, 187, 204]);
  });

  it("throws on invalid hex", () => {
    expect(() => hexToRgb("bad" as any)).toThrow("Invalid hex color");
  });
});

describe("getContrastColor", () => {
  it("returns black for light colors", () => {
    expect(getContrastColor("#ffffff")).toBe("#000000");
  });

  it("returns white for dark colors", () => {
    expect(getContrastColor("#000000")).toBe("#ffffff");
  });

  it("throws on invalid hex", () => {
    expect(() => getContrastColor("oops" as any)).toThrow("Invalid hex color");
  });
});

