// apps/shop-bcd/__tests__/orders-api.test.ts
import { GET, PATCH } from "../src/app/api/orders/[id]/route";

jest.mock("@platform-core/orders", () => ({
  __esModule: true,
  getOrdersForCustomer: jest.fn(),
  markCancelled: jest.fn(),
  markDelivered: jest.fn(),
}));

jest.mock("@auth", () => ({
  getCustomerSession: jest.fn(),
}));

const {
  getOrdersForCustomer,
  markCancelled,
  markDelivered,
} = require("@platform-core/orders");
const { getCustomerSession } = require("@auth");

beforeEach(() => {
  jest.resetAllMocks();
  getCustomerSession.mockResolvedValue({ customerId: "cust" });
});

describe("/api/orders/[id]", () => {
  test("GET returns order", async () => {
    getOrdersForCustomer.mockResolvedValue([{ id: "ord1" }]);
    const res = await GET({} as any, { params: { id: "ord1" } });
    expect(getOrdersForCustomer).toHaveBeenCalledWith("bcd", "cust");
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ order: { id: "ord1" } });
  });

  test("PATCH cancels order", async () => {
    markCancelled.mockResolvedValue({ id: "ord1" });
    const req = { json: async () => ({ status: "cancelled" }) } as any;
    const res = await PATCH(req, { params: { id: "ord1" } });
    expect(markCancelled).toHaveBeenCalledWith("bcd", "ord1");
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ order: { id: "ord1" } });
  });

  test("PATCH marks order delivered", async () => {
    markDelivered.mockResolvedValue({ id: "ord1" });
    const req = { json: async () => ({ status: "delivered" }) } as any;
    const res = await PATCH(req, { params: { id: "ord1" } });
    expect(markDelivered).toHaveBeenCalledWith("bcd", "ord1");
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ order: { id: "ord1" } });
  });

  test("GET returns 404 when order not found", async () => {
    getOrdersForCustomer.mockResolvedValue([]);
    const res = await GET({} as any, { params: { id: "missing" } });
    expect(res.status).toBe(404);
  });

  test("GET returns 401 when session missing", async () => {
    getCustomerSession.mockResolvedValue(null);
    const res = await GET({} as any, { params: { id: "ord1" } });
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  test("PATCH returns 401 when session missing", async () => {
    getCustomerSession.mockResolvedValue(null);
    const req = { json: async () => ({ status: "cancelled" }) } as any;
    const res = await PATCH(req, { params: { id: "ord1" } });
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  test("PATCH returns 400 for invalid status", async () => {
    const req = { json: async () => ({ status: "unknown" }) } as any;
    const res = await PATCH(req, { params: { id: "ord1" } });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid status" });
  });

  test("GET returns 500 on backend failure", async () => {
    getOrdersForCustomer.mockRejectedValue(new Error("boom"));
    const res = await GET({} as any, { params: { id: "ord1" } });
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "boom" });
  });

  test("PATCH returns 500 on backend failure", async () => {
    markCancelled.mockRejectedValue(new Error("oops"));
    const req = { json: async () => ({ status: "cancelled" }) } as any;
    const res = await PATCH(req, { params: { id: "ord1" } });
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "oops" });
  });

  test.todo("PATCH refunds order once backend supports it");
});

