import { validateInventoryItems } from "../useInventoryValidation";

jest.mock("@acme/types", () => {
  const { z } = require("zod");
  const inventoryItemSchema = z
    .object({
      sku: z.string(),
      productId: z.string(),
      variantAttributes: z.record(z.string()),
      quantity: z.number().int().min(0),
      lowStockThreshold: z.number().int().min(0).optional(),
    })
    .strict();
  return { inventoryItemSchema };
});

describe("validateInventoryItems", () => {
  it("returns data for valid items", () => {
    const res = validateInventoryItems([
      {
        sku: "sku1",
        productId: "sku1",
        variantAttributes: {},
        quantity: 1,
        lowStockThreshold: 0,
      },
    ]);
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
  });

  it("returns error for invalid quantity", () => {
    const res = validateInventoryItems([
      {
        sku: "sku1",
        productId: "sku1",
        variantAttributes: {},
        quantity: -1,
      } as any,
    ]);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/greater than or equal to 0/i);
  });
});

