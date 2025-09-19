import {
  hexToRgb,
  getContrastColor,
  hexToHsl,
  hslToHex,
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
  it("returns the foreground token for light colors", () => {
    expect(getContrastColor("#ffffff")).toBe("var(--color-fg)");
  });

  it("returns the background token for dark colors", () => {
    expect(getContrastColor("#000000")).toBe("var(--color-bg)");
  });

  it("uses the background token for saturated colors", () => {
    expect(getContrastColor("#ff0000")).toBe("var(--color-bg)");
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

  it("returns zero hue and saturation for grayscale colors", () => {
    const [h, s] = hexToHsl("#333333").split(" ");
    expect(h).toBe("0");
    expect(s).toBe("0%");
  });
});

describe("hslToHex", () => {
  it("converts black HSL to hex", () => {
    expect(hslToHex("0 0% 0%")).toBe("#000000");
  });

  it("converts fully saturated red", () => {
    expect(hslToHex("360 100% 50%")).toBe("#ff0000");
  });

  it("converts fully saturated green", () => {
    expect(hslToHex("120 100% 50%")).toBe("#00ff00");
  });
});

