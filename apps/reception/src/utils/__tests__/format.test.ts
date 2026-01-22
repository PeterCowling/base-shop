
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
});
