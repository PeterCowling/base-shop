// apps/cover-me-pretty/__tests__/orders-api.test.ts
import { GET, PATCH } from "../src/app/api/orders/[id]/route";
import { jsonRequest } from "@acme/test-utils";
import {
  getOrdersForCustomer,
  markCancelled,
  markDelivered,
  refundOrder,
} from "@acme/platform-core/orders";
import { getCustomerSession } from "@acme/auth";
import { stripe } from "@acme/stripe";

jest.mock("@acme/platform-core/orders", () => ({
  __esModule: true,
  getOrdersForCustomer: jest.fn(),
  markCancelled: jest.fn(),
  markDelivered: jest.fn(),
  refundOrder: jest.fn(),
}));

jest.mock("@acme/auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
}));

jest.mock("@acme/stripe", () => ({
  __esModule: true,
  stripe: {
    refunds: { create: jest.fn() },
  },
}));

const getOrdersForCustomerMock = jest.mocked(getOrdersForCustomer);
const markCancelledMock = jest.mocked(markCancelled);
const markDeliveredMock = jest.mocked(markDelivered);
const refundOrderMock = jest.mocked(refundOrder);
const getCustomerSessionMock = jest.mocked(getCustomerSession);
const stripeMock = jest.mocked(stripe);

beforeEach(() => {
  jest.resetAllMocks();
  getCustomerSessionMock.mockResolvedValue({ customerId: "cust" });
});

describe("/api/orders/[id]", () => {
  test("GET returns order", async () => {
    getOrdersForCustomerMock.mockResolvedValue([{ id: "ord1" }]);
    const res = await GET(
      new Request("http://example.com/api/orders/ord1"),
      { params: { id: "ord1" } },
    );
    expect(getOrdersForCustomer).toHaveBeenCalledWith("cover-me-pretty", "cust");
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ order: { id: "ord1" } });
  });

  test("PATCH cancels order", async () => {
    markCancelledMock.mockResolvedValue({ id: "ord1" });
    const res = await PATCH(jsonRequest({ status: "cancelled" }), { params: { id: "ord1" } });
    expect(markCancelled).toHaveBeenCalledWith("cover-me-pretty", "ord1");
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ order: { id: "ord1" } });
  });

  test("PATCH marks order delivered", async () => {
    markDeliveredMock.mockResolvedValue({ id: "ord1" });
    const res = await PATCH(jsonRequest({ status: "delivered" }), { params: { id: "ord1" } });
    expect(markDelivered).toHaveBeenCalledWith("cover-me-pretty", "ord1");
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ order: { id: "ord1" } });
  });

  test("GET returns 404 when order not found", async () => {
    getOrdersForCustomerMock.mockResolvedValue([]);
    const res = await GET(
      new Request("http://example.com/api/orders/missing"),
      { params: { id: "missing" } },
    );
    expect(res.status).toBe(404);
  });

  test("GET returns 401 when session missing", async () => {
    getCustomerSessionMock.mockResolvedValue(null);
    const res = await GET(
      new Request("http://example.com/api/orders/ord1"),
      { params: { id: "ord1" } },
    );
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  test("PATCH returns 401 when session missing", async () => {
    getCustomerSessionMock.mockResolvedValue(null);
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
    getOrdersForCustomerMock.mockRejectedValue(new Error("boom"));
    const res = await GET(
      new Request("http://example.com/api/orders/ord1"),
      { params: { id: "ord1" } },
    );
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "boom" });
  });

  test("PATCH returns 500 on backend failure", async () => {
    markCancelledMock.mockRejectedValue(new Error("oops"));
    const res = await PATCH(jsonRequest({ status: "cancelled" }), { params: { id: "ord1" } });
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "oops" });
  });
 
  test("PATCH fully refunds order", async () => {
    refundOrderMock.mockResolvedValue({ id: "ord1", refundedAt: "now" });
    const res = await PATCH(jsonRequest({ status: "refunded" }), { params: { id: "ord1" } });
    expect(refundOrder).toHaveBeenCalledWith("cover-me-pretty", "ord1", undefined);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      order: { id: "ord1", refundedAt: "now" },
    });
  });

  test("PATCH partially refunds order", async () => {
    refundOrderMock.mockResolvedValue({ id: "ord1", refundedAt: "now" });
    const res = await PATCH(jsonRequest({ status: "refunded", amount: 5 }), { params: { id: "ord1" } });
    expect(refundOrder).toHaveBeenCalledWith("cover-me-pretty", "ord1", 5);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      order: { id: "ord1", refundedAt: "now" },
    });
  });

  test("PATCH refund returns 401 when session missing", async () => {
    getCustomerSessionMock.mockResolvedValue(null);
    const res = await PATCH(jsonRequest({ status: "refunded" }), { params: { id: "ord1" } });
    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(refundOrder).not.toHaveBeenCalled();
  });

  test("PATCH refund returns 404 when order not found", async () => {
    refundOrderMock.mockResolvedValue(null);
    const res = await PATCH(jsonRequest({ status: "refunded" }), { params: { id: "ord1" } });
    expect(refundOrder).toHaveBeenCalledWith("cover-me-pretty", "ord1", undefined);
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "Order not found" });
  });

  test("PATCH refund returns 400 for invalid amount", async () => {
    const res = await PATCH(
      jsonRequest({ status: "refunded", amount: "bad" }),
      { params: { id: "ord1" } },
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid amount" });
    expect(refundOrder).not.toHaveBeenCalled();
  });

  test("PATCH surfaces stripe refund errors", async () => {
    refundOrderMock.mockImplementation(async (_shop: string, _id: string, amount: number | undefined) => {
      await stripeMock.refunds.create({ amount });
      return { id: "ord1", refundedAt: "now" };
    });
    stripeMock.refunds.create.mockRejectedValue(new Error("stripe fail"));
    const res = await PATCH(jsonRequest({ status: "refunded", amount: 5 }), { params: { id: "ord1" } });
    expect(refundOrder).toHaveBeenCalledWith("cover-me-pretty", "ord1", 5);
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "stripe fail" });
  });
});
