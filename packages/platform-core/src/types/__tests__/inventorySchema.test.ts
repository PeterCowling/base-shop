import { inventoryItemSchema } from "../inventory";

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
