import {
  inventoryValidationBodySchema,
  normalizeInventoryValidationItem,
} from "../src/types/inventory";

describe("inventory validate contract", () => {
  test("accepts canonical items with variantAttributes", () => {
    const body = inventoryValidationBodySchema.parse({
      shopId: "shop",
      items: [{ sku: "sku1", quantity: 1, variantAttributes: { size: "adult" } }],
    });

    expect(normalizeInventoryValidationItem(body.items[0]!)).toEqual({
      sku: "sku1",
      quantity: 1,
      variantAttributes: { size: "adult" },
    });
  });

  test("accepts deprecated variantKey when consistent", () => {
    const body = inventoryValidationBodySchema.parse({
      shopId: "shop",
      items: [{ sku: "sku1", quantity: 1, variantKey: "sku1#size:adult" }],
    });

    expect(normalizeInventoryValidationItem(body.items[0]!)).toEqual({
      sku: "sku1",
      quantity: 1,
      variantAttributes: { size: "adult" },
    });
  });

  test("fails closed when variantKey and variantAttributes mismatch", () => {
    const body = inventoryValidationBodySchema.parse({
      shopId: "shop",
      items: [
        {
          sku: "sku1",
          quantity: 1,
          variantKey: "sku1#size:kids",
          variantAttributes: { size: "adult" },
        },
      ],
    });

    expect(normalizeInventoryValidationItem(body.items[0]!)).toEqual({
      error: "variantKey does not match variantAttributes",
    });
  });
});

