import { getComuneInfo } from "../comuneCodes";

describe("comuneCodes lookup", () => {
  it("returns code and province for known comuni", async () => {
    await expect(getComuneInfo("Abano Terme")).resolves.toEqual(["405028001", "PD"]);
    await expect(getComuneInfo("Vinovo")).resolves.toEqual(["401001309", "TO"]);
  });

  it("matches comuni case-insensitively", async () => {
    await expect(getComuneInfo("abano terme")).resolves.toEqual(["405028001", "PD"]);
    await expect(getComuneInfo("vinovo")).resolves.toEqual(["401001309", "TO"]);
  });

  it("falls back to Unknown for missing comuni", async () => {
    await expect(getComuneInfo("Unknown Town")).resolves.toEqual(["Unknown", "Unknown"]);
  });
});
