import {
  hexToRgb,
  getContrastColor,
  hexToHsl,
  isHex,
  isHsl,
} from "../src/utils/colorUtils";

describe("isHex", () => {
  it("accepts short and long hex colors", () => {
    expect(isHex("#fff")).toBe(true);
    expect(isHex("#ffffff")).toBe(true);
  });

  it("rejects non-hex strings", () => {
    expect(isHex("not-hex")).toBe(false);
  });
});

describe("isHsl", () => {
  it("accepts valid HSL string", () => {
    expect(isHsl("0 0% 0%")).toBe(true);
  });

  it("rejects malformed inputs", () => {
    expect(isHsl("0 0 0")).toBe(false);
  });
});

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

