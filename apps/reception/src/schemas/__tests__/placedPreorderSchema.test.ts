
import "@testing-library/jest-dom";

import { placedPreorderSchema } from "../placedPreorderSchema";

describe("placedPreorderSchema", () => {
  it("accepts a valid preorder", () => {
    const result = placedPreorderSchema.safeParse({
      preorderTime: "10:00",
      items: [
        { product: "Coffee", count: 1 },
        { product: "Donut", count: 2, price: 1.5, lineType: "kds" },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects missing preorderTime", () => {
    const result = placedPreorderSchema.safeParse({
      items: [{ product: "Coffee", count: 1 }],
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid items", () => {
    const result = placedPreorderSchema.safeParse({
      preorderTime: "10:00",
      items: [{ product: "Coffee" } as unknown],
    });

    expect(result.success).toBe(false);
  });
});
