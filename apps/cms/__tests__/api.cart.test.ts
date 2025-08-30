import { jest } from "@jest/globals";

if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: any, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

afterEach(() => {
  jest.resetModules();
  jest.resetAllMocks();
});

describe("cart API", () => {
  it("returns empty cart", async () => {
    const { GET } = await import("../src/app/api/cart/route");
    const res = await GET();
    const json = await res.json();
    expect(json).toEqual({ ok: true, cart: {} });
  });

  it("returns 404 for unknown sku", async () => {
    const { POST } = await import("../src/app/api/cart/route");
    const req = new Request("http://test.local/api/cart", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sku: { id: "missing" }, qty: 1 }),
    }) as any;
    const res = await POST(req);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json).toEqual({ error: "Item not found" });
  });
});
