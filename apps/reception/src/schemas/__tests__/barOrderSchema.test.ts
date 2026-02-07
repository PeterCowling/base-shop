
import "@testing-library/jest-dom";

import { type BarOrder,barOrderSchema } from "../barOrderSchema";
import { salesOrderItemSchema } from "../salesOrderSchema";

describe("barOrderSchema", () => {
  it("passes for a valid order", () => {
    const items = [
      salesOrderItemSchema.parse({ product: "Beer", count: 1 }),
      salesOrderItemSchema.parse({
        product: "Pretzel",
        count: 2,
        price: 4.5,
        lineType: "bds",
      }),
    ];

    const result = barOrderSchema.safeParse({ confirmed: true, items });
    expect(result.success).toBe(true);
  });

  it("fails for invalid item shapes", () => {
    const invalidItems = [{ product: "Beer", count: "1" }, { count: 2 }];
    const result = barOrderSchema.safeParse({
      confirmed: true,
      items: invalidItems as unknown as BarOrder["items"],
    });
    expect(result.success).toBe(false);
  });

  it("fails when confirmed is missing", () => {
    const items = [salesOrderItemSchema.parse({ product: "Beer", count: 1 })];
    const result = barOrderSchema.safeParse({ items } as unknown as BarOrder);
    expect(result.success).toBe(false);
  });
});
