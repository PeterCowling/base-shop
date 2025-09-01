import { providers, providersByType } from "../src/providers";

describe("providersByType", () => {
  it.each(["payment", "shipping", "analytics"] as const)(
    "returns only %s providers",
    (type) => {
      const result = providersByType(type);
      expect(result).toHaveLength(
        providers.filter((p) => p.type === type).length
      );
      expect(result.every((p) => p.type === type)).toBe(true);
    }
  );

  it("returns empty array for unknown type", () => {
    expect(providersByType("unknown" as any)).toEqual([]);
  });
});
