import { jest } from "@jest/globals";
import { jsonRequest, asNextJson } from "@acme/test-utils";

afterEach(() => {
  jest.resetModules();
  jest.resetAllMocks();
});

describe("cart API", () => {
  it("returns empty cart", async () => {
    const { GET } = await import("../src/app/api/cart/route");
    const res = await GET({
      cookies: { get: () => undefined },
    } as any);
    const json = await res.json();
    expect(json).toEqual({ ok: true, cart: {} });
  });

  it("returns 404 for unknown sku", async () => {
    const { POST } = await import("../src/app/api/cart/route");
    const res = await POST(
      jsonRequest({ sku: { id: "missing" }, qty: 1 }, { url: "http://test.local/api/cart" })
    );
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json).toEqual({ error: "Item not found" });
  });

  it("handles SKU without sizes", async () => {
    jest.doMock("@acme/platform-core/products", () => ({
      __esModule: true,
      getProductById: () => ({ id: "foo", stock: 1 }),
      PRODUCTS: [{ id: "foo", stock: 1 }],
    }));

    const { POST } = await import("../src/app/api/cart/route");
    const res = await POST(asNextJson({ sku: { id: "foo" }, qty: 1 }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });
});
