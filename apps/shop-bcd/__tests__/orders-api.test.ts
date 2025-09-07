// apps/shop-bcd/__tests__/orders-api.test.ts
import { GET, PATCH } from "../src/app/api/orders/[id]/route";

jest.mock("@platform-core/orders", () => ({
  __esModule: true,
  getOrdersForCustomer: jest.fn(),
  markCancelled: jest.fn(),
  markDelivered: jest.fn(),
  markRefunded: jest.fn(),
}));

jest.mock("@acme/stripe", () => ({
  __esModule: true,
  stripe: {
    checkout: { sessions: { retrieve: jest.fn() } },
    refunds: { create: jest.fn() },
  },
}));

jest.mock("@auth", () => ({
  getCustomerSession: jest.fn(),
}));

const {
  getOrdersForCustomer,
  markCancelled,
  markDelivered,
  markRefunded,
} = require("@platform-core/orders");
const { stripe } = require("@acme/stripe");
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

  test("PATCH refunds full deposit", async () => {
    getOrdersForCustomer.mockResolvedValue([
      { id: "ord1", deposit: 50, damageFee: 0 },
    ]);
    (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({
      payment_intent: { id: "pi_123" },
    });
    (stripe.refunds.create as jest.Mock).mockResolvedValue({});
    markRefunded.mockResolvedValue({ id: "ord1" });
    const req = { json: async () => ({ status: "refunded" }) } as any;
    const res = await PATCH(req, { params: { id: "ord1" } });
    expect(stripe.checkout.sessions.retrieve).toHaveBeenCalledWith("ord1", {
      expand: ["payment_intent"],
    });
    expect(stripe.refunds.create).toHaveBeenCalledWith({
      payment_intent: "pi_123",
      amount: 50 * 100,
    });
    expect(markRefunded).toHaveBeenCalledWith("bcd", "ord1");
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ order: { id: "ord1" } });
  });

  test("PATCH refunds partial deposit", async () => {
    getOrdersForCustomer.mockResolvedValue([
      { id: "ord1", deposit: 50, damageFee: 20 },
    ]);
    (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({
      payment_intent: { id: "pi_123" },
    });
    (stripe.refunds.create as jest.Mock).mockResolvedValue({});
    markRefunded.mockResolvedValue({ id: "ord1" });
    const req = { json: async () => ({ status: "refunded" }) } as any;
    const res = await PATCH(req, { params: { id: "ord1" } });
    expect(stripe.refunds.create).toHaveBeenCalledWith({
      payment_intent: "pi_123",
      amount: 30 * 100,
    });
    expect(markRefunded).toHaveBeenCalledWith("bcd", "ord1");
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ order: { id: "ord1" } });
  });

  test("PATCH returns 500 when refund fails", async () => {
    getOrdersForCustomer.mockResolvedValue([
      { id: "ord1", deposit: 50, damageFee: 0 },
    ]);
    (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue({
      payment_intent: { id: "pi_123" },
    });
    (stripe.refunds.create as jest.Mock).mockRejectedValue(new Error("fail"));
    const req = { json: async () => ({ status: "refunded" }) } as any;
    const res = await PATCH(req, { params: { id: "ord1" } });
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "fail" });
  });
});

