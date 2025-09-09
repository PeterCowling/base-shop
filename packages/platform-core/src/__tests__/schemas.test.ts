import { addressSchema } from "../schemas/address";
import { postSchema } from "../schemas/cart";

describe("addressSchema", () => {
  it("accepts valid addresses", () => {
    const result = addressSchema.safeParse({
      line1: "123 Main St",
      city: "Springfield",
      postal_code: "12345",
      country: "US",
    });
    expect(result.success).toBe(true);
  });

  it("rejects addresses missing required fields", () => {
    const result = addressSchema.safeParse({
      line1: "123 Main St",
      city: "Springfield",
      postal_code: "12345",
      // country missing
    } as any);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["country"]);
    expect(result.error?.issues[0]?.message).toBe("Required");
  });
});

describe("cart postSchema", () => {
  it("accepts valid cart line items", () => {
    const result = postSchema.safeParse({
      sku: { id: "sku_123" },
      qty: 2,
    });
    expect(result.success).toBe(true);
  });

  it("rejects cart line items missing sku", () => {
    const result = postSchema.safeParse({ qty: 2 } as any);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["sku"]);
    expect(result.error?.issues[0]?.message).toBe("Required");
  });
});
