import { patchSchema, postSchema, putSchema } from "../src/schemas/cart";

describe("cart postSchema", () => {
  it("accepts valid cart line items", () => {
    const result = postSchema.safeParse({ sku: { id: "sku_123" }, qty: 2 });
    expect(result.success).toBe(true);
  });

  it("rejects cart line items missing sku", () => {
    const result = postSchema.safeParse({ qty: 2 } as any);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["sku"]);
  });

  it("rejects cart line items with invalid qty", () => {
    const result = postSchema.safeParse({ sku: { id: "sku_123" }, qty: 0 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["qty"]);
  });
});

describe("cart patchSchema", () => {
  it("accepts valid patches", () => {
    const result = patchSchema.safeParse({ id: "line_1", qty: 1 });
    expect(result.success).toBe(true);
  });

  it("rejects patches missing id", () => {
    const result = patchSchema.safeParse({ qty: 1 } as any);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["id"]);
  });

  it("rejects patches with negative qty", () => {
    const result = patchSchema.safeParse({ id: "line_1", qty: -1 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["qty"]);
  });
});

describe("cart putSchema", () => {
  it("accepts valid cart payload", () => {
    const result = putSchema.safeParse({
      lines: [{ sku: { id: "sku_123" }, qty: 1 }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects payloads missing lines", () => {
    const result = putSchema.safeParse({} as any);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["lines"]);
  });

  it("rejects payloads with malformed line items", () => {
    const result = putSchema.safeParse({
      lines: [{ qty: 1 } as any],
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["lines", 0, "sku"]);
  });
});
