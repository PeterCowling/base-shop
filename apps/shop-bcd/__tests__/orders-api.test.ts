// apps/shop-bcd/__tests__/orders-api.test.ts
import { GET, PATCH } from "../src/app/api/orders/[id]/route";
import { jsonRequest } from "@acme/test-utils";

jest.mock("@platform-core/orders", () => ({
  __esModule: true,
  getOrdersForCustomer: jest.fn(),
  markCancelled: jest.fn(),
  markDelivered: jest.fn(),
  refundOrder: jest.fn(),
}));

jest.mock("@auth", () => ({
  getCustomerSession: jest.fn(),
}));

jest.mock("@acme/stripe", () => ({
  stripe: {
    refunds: { create: jest.fn() },
  },
}));

const {
  getOrdersForCustomer,
  markCancelled,
  markDelivered,
  refundOrder,
} = require("@platform-core/orders");
const { getCustomerSession } = require("@auth");
const { stripe } = require("@acme/stripe");

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
    const res = await PATCH(jsonRequest({ status: "cancelled" }), { params: { id: "ord1" } });
    expect(markCancelled).toHaveBeenCalledWith("bcd", "ord1");
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ order: { id: "ord1" } });
  });

  test("PATCH marks order delivered", async () => {
    markDelivered.mockResolvedValue({ id: "ord1" });
    const res = await PATCH(jsonRequest({ status: "delivered" }), { params: { id: "ord1" } });
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
    const res = await PATCH(jsonRequest({ status: "cancelled" }), { params: { id: "ord1" } });
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  test("PATCH returns 400 for invalid status", async () => {
    const res = await PATCH(jsonRequest({ status: "unknown" }), { params: { id: "ord1" } });
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
    const res = await PATCH(jsonRequest({ status: "cancelled" }), { params: { id: "ord1" } });
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "oops" });
  });
 
  test("PATCH fully refunds order", async () => {
    refundOrder.mockResolvedValue({ id: "ord1", refundedAt: "now" });
    const res = await PATCH(jsonRequest({ status: "refunded" }), { params: { id: "ord1" } });
    expect(refundOrder).toHaveBeenCalledWith("bcd", "ord1", undefined);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      order: { id: "ord1", refundedAt: "now" },
    });
  });

  test("PATCH partially refunds order", async () => {
    refundOrder.mockResolvedValue({ id: "ord1", refundedAt: "now" });
    const res = await PATCH(jsonRequest({ status: "refunded", amount: 5 }), { params: { id: "ord1" } });
    expect(refundOrder).toHaveBeenCalledWith("bcd", "ord1", 5);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      order: { id: "ord1", refundedAt: "now" },
    });
  });

  test("PATCH refund returns 401 when session missing", async () => {
    getCustomerSession.mockResolvedValue(null);
    const res = await PATCH(jsonRequest({ status: "refunded" }), { params: { id: "ord1" } });
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(refundOrder).not.toHaveBeenCalled();
  });

  test("PATCH refund returns 404 when order not found", async () => {
    refundOrder.mockResolvedValue(null);
    const res = await PATCH(jsonRequest({ status: "refunded" }), { params: { id: "ord1" } });
    expect(refundOrder).toHaveBeenCalledWith("bcd", "ord1", undefined);
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "Order not found" });
  });

  test("PATCH refund returns 400 for invalid amount", async () => {
    const res = await PATCH(jsonRequest({ status: "refunded", amount: "bad" as any }), { params: { id: "ord1" } });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid amount" });
    expect(refundOrder).not.toHaveBeenCalled();
  });

  test("PATCH surfaces stripe refund errors", async () => {
    refundOrder.mockImplementation(async (_shop: string, _id: string, amount: number | undefined) => {
      await stripe.refunds.create({ amount });
      return { id: "ord1", refundedAt: "now" };
    });
    stripe.refunds.create.mockRejectedValue(new Error("stripe fail"));
    const res = await PATCH(jsonRequest({ status: "refunded", amount: 5 }), { params: { id: "ord1" } });
    expect(refundOrder).toHaveBeenCalledWith("bcd", "ord1", 5);
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "stripe fail" });
  });
});
