const checkShopExists = jest.fn();
jest.mock("@acme/lib", () => ({
  checkShopExists: (...args: any[]) => checkShopExists(...args),
}));

const listStockInflows = jest.fn();
const receiveStockInflow = jest.fn();
jest.mock("@acme/platform-core/repositories/stockInflows.server", () => ({
  listStockInflows: (...args: any[]) => listStockInflows(...args),
  receiveStockInflow: (...args: any[]) => receiveStockInflow(...args),
}));

function setSession(session: any) {
  const { __setMockSession } = require("next-auth") as {
    __setMockSession: (s: any) => void;
  };
  __setMockSession(session);
}

afterEach(() => {
  jest.resetModules();
  jest.resetAllMocks();
});

describe("/api/shop/[shop]/stock-inflows", () => {
  it("GET returns 403 when session missing", async () => {
    setSession(null);
    const { GET } = await import("../route");
    const res = await GET(new Request("http://localhost/api/shop/demo/stock-inflows") as any, {
      params: Promise.resolve({ shop: "demo" }),
    });
    expect(res.status).toBe(403);
  });

  it("GET returns 404 when shop not found", async () => {
    setSession({ user: { role: "admin" } });
    checkShopExists.mockResolvedValue(false);
    const { GET } = await import("../route");
    const res = await GET(new Request("http://localhost/api/shop/demo/stock-inflows?limit=10") as any, {
      params: Promise.resolve({ shop: "demo" }),
    });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Shop not found" });
  });

  it("GET returns events when authorized", async () => {
    setSession({ user: { role: "admin" } });
    checkShopExists.mockResolvedValue(true);
    listStockInflows.mockResolvedValue([{ id: "e1" }]);
    const { GET } = await import("../route");
    const res = await GET(new Request("http://localhost/api/shop/demo/stock-inflows?limit=10") as any, {
      params: Promise.resolve({ shop: "demo" }),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ events: [{ id: "e1" }] });
    expect(listStockInflows).toHaveBeenCalledWith("demo", { limit: 10 });
  });

  it("POST returns 403 when role lacks permission", async () => {
    setSession({ user: { role: "CatalogManager" } });
    const { POST } = await import("../route");
    const res = await POST(
      new Request("http://localhost/api/shop/demo/stock-inflows", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }) as any,
      { params: Promise.resolve({ shop: "demo" }) },
    );
    expect(res.status).toBe(403);
  });

  it("POST returns 201 on successful receipt", async () => {
    setSession({ user: { role: "admin", id: "u1" } });
    checkShopExists.mockResolvedValue(true);
    receiveStockInflow.mockResolvedValue({
      ok: true,
      duplicate: false,
      report: { shop: "demo", created: 0, updated: 0, items: [] },
      event: { id: "e1", receivedAt: "2025-01-01T00:00:00.000Z", items: [], report: { created: 0, updated: 0, items: [] } },
    });
    const { POST } = await import("../route");
    const res = await POST(
      new Request("http://localhost/api/shop/demo/stock-inflows", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idempotencyKey: "00000000-0000-4000-8000-000000000000", items: [{ sku: "s", productId: "p", quantity: 1 }] }),
      }) as any,
      { params: Promise.resolve({ shop: "demo" }) },
    );
    expect(res.status).toBe(201);
    expect(receiveStockInflow).toHaveBeenCalledWith(
      "demo",
      expect.anything(),
      { actor: { customerId: "u1", role: "admin" } },
    );
  });

  it("POST returns 200 on duplicate idempotency key", async () => {
    setSession({ user: { role: "admin", id: "u1" } });
    checkShopExists.mockResolvedValue(true);
    receiveStockInflow.mockResolvedValue({
      ok: true,
      duplicate: true,
      report: { shop: "demo", created: 0, updated: 0, items: [] },
      event: { id: "e1", receivedAt: "2025-01-01T00:00:00.000Z", items: [], report: { created: 0, updated: 0, items: [] } },
    });
    const { POST } = await import("../route");
    const res = await POST(
      new Request("http://localhost/api/shop/demo/stock-inflows", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ idempotencyKey: "00000000-0000-4000-8000-000000000000", items: [{ sku: "s", productId: "p", quantity: 1 }] }),
      }) as any,
      { params: Promise.resolve({ shop: "demo" }) },
    );
    expect(res.status).toBe(200);
  });

  it("POST returns 400 when payload is invalid", async () => {
    setSession({ user: { role: "admin", id: "u1" } });
    checkShopExists.mockResolvedValue(true);
    receiveStockInflow.mockResolvedValue({
      ok: false,
      code: "INVALID_REQUEST",
      message: "Invalid request",
    });
    const { POST } = await import("../route");
    const res = await POST(
      new Request("http://localhost/api/shop/demo/stock-inflows", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }) as any,
      { params: Promise.resolve({ shop: "demo" }) },
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false, code: "INVALID_REQUEST", message: "Invalid request" });
  });
});


export {};
