import { providers, providersByType } from "../src/providers";

describe("providers", () => {
  it("every provider contains id, name, and type", () => {
    providers.forEach((provider) => {
      expect(provider).toHaveProperty("id");
      expect(provider).toHaveProperty("name");
      expect(provider).toHaveProperty("type");
    });
  });

  it("has unique ids", () => {
    const ids = providers.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

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

  it("returns empty array for undefined type without mutating providers", () => {
    const original = [...providers];
    const result = providersByType(undefined as any);
    expect(result).toEqual([]);
    expect(providers).toEqual(original);
  });

  it("returns new arrays without mutating original providers list", () => {
    const original = [...providers];
    const result = providersByType("payment");
    expect(result).not.toBe(providers);
    (result as any).push({ id: "test", name: "Test", type: "payment" });
    expect(providers).toEqual(original);
  });
});
