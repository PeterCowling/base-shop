import { shopSchema } from "../schemas";

describe("jsonRecord", () => {
  const jsonRecord = (shopSchema._def.schema as any).shape.themeOverrides;

  it("parses valid JSON", () => {
    const result = jsonRecord.safeParse('{"foo":"bar"}');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ foo: "bar" });
    }
  });

  it("returns issue for invalid JSON", () => {
    const result = jsonRecord.safeParse("{invalid}");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Invalid JSON");
    }
  });

  it("defaults to empty object when absent", () => {
    const result = jsonRecord.parse(undefined);
    expect(result).toEqual({});
  });
});

describe("shopSchema boolean fields", () => {
  const base = {
    id: "1",
    name: "Test Shop",
    themeId: "theme",
    themeOverrides: "{}",
    themeDefaults: "{}",
    filterMappings: "{}",
    priceOverrides: "{}",
    localeOverrides: "{}",
  };

  const fields = [
    "blog",
    "contentMerchandising",
    "raTicketing",
    "requireStrongCustomerAuth",
    "strictReturnConditions",
    "trackingDashboard",
    "premierDelivery",
  ] as const;

  it.each(fields)("parses %s correctly", (field) => {
    const onResult = shopSchema.parse({ ...base, [field]: "on" });
    const offResult = shopSchema.parse({ ...base, [field]: "off" });
    const missingResult = shopSchema.parse(base);

    expect(onResult.luxuryFeatures[field]).toBe(true);
    expect(offResult.luxuryFeatures[field]).toBe(false);
    expect(missingResult.luxuryFeatures[field]).toBe(false);
  });
});
