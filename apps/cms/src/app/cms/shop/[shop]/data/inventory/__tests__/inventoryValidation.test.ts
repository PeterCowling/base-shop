import { validateInventoryItems } from "../useInventoryValidation";
import type { InventoryItem } from "@acme/platform-core/types/inventory";

jest.mock("@acme/platform-core/types/inventory", () => {
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

jest.mock("@acme/platform-core/utils/inventory", () => ({
  expandInventoryItem: jest.fn((i) => i),
}));
const { expandInventoryItem } = require("@acme/platform-core/utils/inventory") as {
  expandInventoryItem: jest.Mock;
};

describe("validateInventoryItems", () => {
  it("returns data for valid items and strips empty variant values", () => {
    const res = validateInventoryItems([
      {
        sku: "sku1",
        productId: "sku1",
        variantAttributes: { color: "blue", size: "" },
        quantity: 1,
        lowStockThreshold: 0,
      },
    ]);
    expect(res.success).toBe(true);
    expect(res.data).toHaveLength(1);
    expect(res.data[0].variantAttributes).toEqual({ color: "blue" });
  });

  it("returns error for invalid quantity", () => {
    const res = validateInventoryItems([
      {
        sku: "sku1",
        productId: "sku1",
        variantAttributes: {},
        quantity: -1,
      } as unknown as InventoryItem,
    ]);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/greater than or equal to 0/i);
  });

  it("returns error for missing sku", () => {
    const res = validateInventoryItems([
      {
        sku: "",
        productId: "",
        variantAttributes: {},
        quantity: 1,
      } as unknown as InventoryItem,
    ]);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/SKU is required/i);
  });

  it("returns error for missing quantity", () => {
    const res = validateInventoryItems([
      {
        sku: "sku1",
        productId: "sku1",
        variantAttributes: {},
        quantity: NaN,
      } as unknown as InventoryItem,
    ]);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/Quantity is required/i);
  });

  it("propagates expandInventoryItem errors", () => {
    expandInventoryItem.mockImplementationOnce(() => {
      throw new Error("boom");
    });
    const res = validateInventoryItems([
      {
        sku: "sku1",
        productId: "sku1",
        variantAttributes: {},
        quantity: 1,
      },
    ]);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/boom/);
  });

  it("returns error for invalid lowStockThreshold", () => {
    const res = validateInventoryItems([
      {
        sku: "sku1",
        productId: "sku1",
        variantAttributes: {},
        quantity: 1,
        lowStockThreshold: -1,
      } as unknown as InventoryItem,
    ]);
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/greater than or equal to 0/i);
  });
});

