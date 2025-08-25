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
});
