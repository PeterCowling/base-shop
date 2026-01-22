
import "@testing-library/jest-dom";

import { getCountryCode } from "../getCountryCode";

describe("getCountryCode", () => {
  it("returns the code for exact match", () => {
    expect(getCountryCode("Italy")).toBe("100000100");
  });

  it("is case insensitive and trims whitespace", () => {
    expect(getCountryCode("italy")).toBe("100000100");
    expect(getCountryCode("ITALY")).toBe("100000100");
    expect(getCountryCode(" Italy ")).toBe("100000100");
  });

  it('returns "Unknown" for an unrecognized country', () => {
    expect(getCountryCode("Atlantis")).toBe("Unknown");
  });
});
