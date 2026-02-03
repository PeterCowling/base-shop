import {
  inventoryItemSchema,
  inventoryValidationItemSchema,
  normalizeInventoryValidationItem,
  parseVariantKey,
  variantKey,
} from "../inventory";

describe("inventoryItemSchema", () => {
  it("rejects negative quantities", () => {
    expect(() =>
      inventoryItemSchema.parse({
        sku: "s1",
        productId: "p1",
        quantity: -1,
        variantAttributes: {},
      }),
    ).toThrow();
  });

  it("rejects empty sku or productId", () => {
    expect(() =>
      inventoryItemSchema.parse({
        sku: "",
        productId: "p1",
        quantity: 1,
        variantAttributes: {},
      }),
    ).toThrow();
    expect(() =>
      inventoryItemSchema.parse({
        sku: "s1",
        productId: "",
        quantity: 1,
        variantAttributes: {},
      }),
    ).toThrow();
  });

  it("rejects non-string variant attribute values", () => {
    expect(() =>
      inventoryItemSchema.parse({
        sku: "s1",
        productId: "p1",
        quantity: 1,
        // @ts-expect-error intentionally wrong type
        variantAttributes: { size: 42 as any },
      }),
    ).toThrow();
  });
});

describe("variantKey", () => {
  it("builds deterministic keys", () => {
    expect(variantKey("sku1", { size: "adult", color: "sand" })).toBe(
      "sku1#color:sand|size:adult",
    );
  });
});

describe("parseVariantKey", () => {
  it("parses a sku-only key", () => {
    expect(parseVariantKey("sku1")).toEqual({ sku: "sku1", variantAttributes: {} });
  });

  it("parses a key with attributes", () => {
    expect(parseVariantKey("sku1#color:sand|size:adult")).toEqual({
      sku: "sku1",
      variantAttributes: { color: "sand", size: "adult" },
    });
  });

  it("rejects malformed keys", () => {
    expect(parseVariantKey("")).toBeNull();
    expect(parseVariantKey("sku1#")).toBeNull();
    expect(parseVariantKey("sku1#noColon")).toBeNull();
    expect(parseVariantKey("sku1#k:")).toBeNull();
    expect(parseVariantKey("sku1#:v")).toBeNull();
    expect(parseVariantKey("sku1#k:v|k:v")).toBeNull();
  });
});

describe("normalizeInventoryValidationItem", () => {
  it("uses variantAttributes when present", () => {
    const parsed = inventoryValidationItemSchema.parse({
      sku: "sku1",
      quantity: 1,
      variantAttributes: { size: "adult" },
    });

    expect(normalizeInventoryValidationItem(parsed)).toEqual({
      sku: "sku1",
      quantity: 1,
      variantAttributes: { size: "adult" },
    });
  });

  it("accepts variantKey-only items and derives variantAttributes", () => {
    const parsed = inventoryValidationItemSchema.parse({
      sku: "sku1",
      quantity: 1,
      variantKey: "sku1#size:adult",
    });

    expect(normalizeInventoryValidationItem(parsed)).toEqual({
      sku: "sku1",
      quantity: 1,
      variantAttributes: { size: "adult" },
    });
  });

  it("fails closed when variantKey does not match variantAttributes", () => {
    const parsed = inventoryValidationItemSchema.parse({
      sku: "sku1",
      quantity: 1,
      variantKey: "sku1#size:kids",
      variantAttributes: { size: "adult" },
    });

    expect(normalizeInventoryValidationItem(parsed)).toEqual({
      error: "variantKey does not match variantAttributes",
    });
  });

  it("fails closed when variantKey sku does not match sku field", () => {
    const parsed = inventoryValidationItemSchema.parse({
      sku: "sku1",
      quantity: 1,
      variantKey: "sku2#size:adult",
    });

    expect(normalizeInventoryValidationItem(parsed)).toEqual({
      error: "variantKey sku does not match sku field",
    });
  });
});
