import { hslToHex, hexToHsl, isHex, isHsl } from "../colorUtils";

describe("colorUtils", () => {
  test.each([
    ["#ff0000", "0 100% 50%"],
    ["#00ff00", "120 100% 50%"],
    ["#0000ff", "240 100% 50%"],
    ["#777777", "0 0% 47%"],
  ])("hexToHsl converts %s to %s", (hex, hsl) => {
    expect(hexToHsl(hex)).toBe(hsl);
  });

  test.each([
    ["0 100% 50%", "#ff0000"],
    ["120 100% 50%", "#00ff00"],
    ["240 100% 50%", "#0000ff"],
    ["0 0% 47%", "#787878"],
  ])("hslToHex converts %s to %s", (hsl, hex) => {
    expect(hslToHex(hsl)).toBe(hex);
  });

  test("hsl and hex conversions are symmetric", () => {
    const colors = ["#ff0000", "#00ff00", "#0000ff"];
    colors.forEach((hex) => {
      expect(hslToHex(hexToHsl(hex))).toBe(hex);
    });
  });

  test("isHex validates hex colors", () => {
    expect(isHex("#fff")).toBe(true);
    expect(isHex("fff")).toBe(false);
  });

  test("isHsl validates HSL colors", () => {
    expect(isHsl("120 100% 50%")).toBe(true);
    expect(isHsl("#fff")).toBe(false);
  });
});
