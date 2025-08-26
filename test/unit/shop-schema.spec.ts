import { shopSchema } from "@acme/types";

describe("shop schema", () => {
  const base = {
    id: "s1",
    name: "Shop",
    catalogFilters: [],
    themeId: "base",
    filterMappings: {},
  };

  it("accepts lastUpgrade and componentVersions", () => {
    const parsed = shopSchema.parse({
      ...base,
      lastUpgrade: new Date(0).toISOString(),
      componentVersions: { foo: "1.0.0" },
    });
    expect(parsed.lastUpgrade).toBeDefined();
    expect(parsed.componentVersions).toEqual({ foo: "1.0.0" });
  });

  it("rejects invalid componentVersions", () => {
    const result = shopSchema.safeParse({
      ...base,
      componentVersions: { foo: 1 } as any,
    });
    expect(result.success).toBe(false);
  });

  it("defaults componentVersions", () => {
    const parsed = shopSchema.parse(base);
    expect(parsed.componentVersions).toEqual({});
    expect(parsed.lastUpgrade).toBeUndefined();
    expect(parsed.luxuryFeatures).toEqual({
      blog: false,
      contentMerchandising: false,
      premierDelivery: false,
      raTicketing: false,
      fraudReviewThreshold: 0,
      requireStrongCustomerAuth: false,
      strictReturnConditions: false,
      trackingDashboard: false,
    });
  });
});
