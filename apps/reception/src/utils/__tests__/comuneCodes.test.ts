import { getComuneInfo } from "../comuneCodes";

describe("comuneCodes lookup", () => {
  it("returns code and province for known comuni", () => {
    expect(getComuneInfo("Abano Terme")).toEqual(["405028001", "PD"]);
    expect(getComuneInfo("Vinovo")).toEqual(["401001309", "TO"]);
  });

  it("matches comuni case-insensitively", () => {
    expect(getComuneInfo("abano terme")).toEqual(["405028001", "PD"]);
    expect(getComuneInfo("vinovo")).toEqual(["401001309", "TO"]);
  });

  it("falls back to Unknown for missing comuni", () => {
    expect(getComuneInfo("Unknown Town")).toEqual(["Unknown", "Unknown"]);
  });
});
