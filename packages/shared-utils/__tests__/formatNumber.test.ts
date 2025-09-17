import { formatNumber } from "../src/formatNumber.ts";

describe("formatNumber", () => {
  it("formats decimals with custom precision", () => {
    expect(
      formatNumber(1234.5, { minimumFractionDigits: 2, maximumFractionDigits: 2 }, "en-US")
    ).toBe("1,234.50");
  });

  it("supports bigint inputs", () => {
    expect(formatNumber(123456n, { notation: "compact" }, "en-US")).toBe("123K");
  });

  it("returns NaN label for non-finite numbers", () => {
    expect(formatNumber(Number.NaN, undefined, "en-US")).toBe("NaN");
  });
});
