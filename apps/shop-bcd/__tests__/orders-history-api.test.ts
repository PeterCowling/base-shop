// apps/shop-bcd/__tests__/orders-history-api.test.ts
jest.mock("@auth", () => ({
  __esModule: true,
  getCustomerSession: jest.fn(),
}));

jest.mock("@platform-core/orders", () => ({
  __esModule: true,
  getOrdersForCustomer: jest.fn(),
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: (data: any, init?: ResponseInit) =>
      new Response(JSON.stringify(data), init),
  },
}));

import { getCustomerSession } from "@auth";
import { getOrdersForCustomer } from "@platform-core/orders";
import { GET } from "../src/app/api/orders/route";

describe("/api/orders GET", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns orders for authenticated user", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({
      customerId: "cust1",
    });
    const orders = [{ id: "o1" }];
    (getOrdersForCustomer as jest.Mock).mockResolvedValue(orders);
    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true, orders });
    expect(getOrdersForCustomer).toHaveBeenCalledWith("bcd", "cust1");
  });

  it("returns 401 for unauthenticated requests", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 500 on database errors", async () => {
    (getCustomerSession as jest.Mock).mockResolvedValue({
      customerId: "cust1",
    });
    (getOrdersForCustomer as jest.Mock).mockRejectedValue(new Error("db"));
    const res = await GET();
    expect(res.status).toBe(500);
  });
});
