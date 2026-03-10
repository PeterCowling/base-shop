
import "@testing-library/jest-dom";

import { formatEuro } from "../format";

describe("formatEuro", () => {
  it("formats positive numbers with two decimals", () => {
    expect(formatEuro(123.456)).toBe("€123.46");
  });

  it("formats negative numbers", () => {
    expect(formatEuro(-5)).toBe("€-5.00");
  });

  it("formats zero", () => {
    expect(formatEuro(0)).toBe("€0.00");
  });

  it("formats localized euro output when requested", () => {
    expect(formatEuro(1234.5, { style: "locale" })).toBe("1.234,50 €");
  });

  it("formats positive values with an explicit sign when requested", () => {
    expect(formatEuro(5, { signDisplay: "always" })).toBe("€+5.00");
  });
});
