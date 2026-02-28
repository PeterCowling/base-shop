import { DELETE,GET, POST } from "@/app/api/cart/route";

jest.mock("@acme/platform-core/cartApiForShop", () => ({
  createShopCartApi: jest.fn(() => ({
    GET: jest.fn(),
    POST: jest.fn(),
    PATCH: jest.fn(),
    DELETE: jest.fn(),
    PUT: jest.fn(),
  })),
}));

const { createShopCartApi } = jest.requireMock("@acme/platform-core/cartApiForShop") as {
  createShopCartApi: jest.Mock;
};

function getHandlers() {
  // The factory is called once at module load; get the return value
  return createShopCartApi.mock.results[0]?.value as {
    GET: jest.Mock;
    POST: jest.Mock;
    DELETE: jest.Mock;
  };
}

const makeReq = (method: string, body?: unknown) =>
  new Request(`http://localhost/api/cart`, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

describe("GET /api/cart", () => {
  it("TC-02: returns 200 with empty cart on fresh session", async () => {
    getHandlers().GET.mockResolvedValue(
      new Response(JSON.stringify({ cart: {} }), { status: 200 }),
    );
    const res = await GET(makeReq("GET") as never);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { cart: Record<string, unknown> };
    expect(body.cart).toEqual({});
  });
});

describe("POST /api/cart", () => {
  it("TC-03: add item → cart contains item", async () => {
    const cartState = { "sku-1": { qty: 1 } };
    getHandlers().POST.mockResolvedValue(
      new Response(JSON.stringify({ cart: cartState }), { status: 200 }),
    );
    const res = await POST(makeReq("POST", { action: "add", skuId: "sku-1", qty: 1 }) as never);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { cart: Record<string, unknown> };
    expect(body.cart["sku-1"]).toBeDefined();
  });
});

describe("DELETE /api/cart", () => {
  it("TC-04: clear → empty cart", async () => {
    getHandlers().DELETE.mockResolvedValue(
      new Response(JSON.stringify({ cart: {} }), { status: 200 }),
    );
    const res = await DELETE(makeReq("DELETE", { clear: true }) as never);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { cart: Record<string, unknown> };
    expect(body.cart).toEqual({});
  });
});
