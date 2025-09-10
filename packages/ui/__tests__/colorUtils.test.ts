import {
  hexToRgb,
  getContrastColor,
  hexToHsl,
  hslToHex,
} from "../src/utils/colorUtils";

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

  it("handles high-contrast colors", () => {
    expect(getContrastColor("#ff0000")).toBe("#ffffff");
  });

  it("throws on invalid hex", () => {
    expect(() => getContrastColor("oops" as any)).toThrow("Invalid hex color");
  });
});

describe("hexToHsl", () => {
  it("converts 6-digit hex to HSL", () => {
    expect(hexToHsl("#123456")).toBe("210 65% 20%");
  });

  it("converts 3-digit hex to HSL", () => {
    expect(hexToHsl("#0f0")).toBe("120 100% 50%");
  });

  it("handles high-contrast colors", () => {
    expect(hexToHsl("#ff0000")).toBe("0 100% 50%");
  });
});

describe("hslToHex", () => {
  it("converts black HSL to hex", () => {
    expect(hslToHex("0 0% 0%")).toBe("#000000");
  });

  it("converts red HSL to hex", () => {
    expect(hslToHex("360 100% 50%")).toBe("#ff0000");
  });
});

