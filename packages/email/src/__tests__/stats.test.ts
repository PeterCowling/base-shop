import { normalizeProviderStats, emptyStats } from "../stats";

describe("normalizeProviderStats", () => {
  it("returns empty stats for unknown provider", () => {
    expect(normalizeProviderStats("unknown", undefined)).toEqual(emptyStats);
  });
});
