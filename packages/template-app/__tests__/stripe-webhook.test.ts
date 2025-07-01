import { jest } from "@jest/globals";
process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test";
if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

afterEach(() => jest.resetModules());

describe("/api/stripe-webhook", () => {
  test("checkout.session.completed creates an order", async () => {
    const addOrder = jest.fn();
    jest.doMock(
      "@platform-core/repositories/rentalOrders.server",
      () => ({
        __esModule: true,
        addOrder,
        markRefunded: jest.fn(),
      }),
      { virtual: true }
    );

    const { POST } = await import("../src/api/stripe-webhook/route");
    const payload = {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "sess",
          metadata: { depositTotal: "10", returnDate: "2030-05-05" },
        },
      },
    } as any;
    const res = await POST({ json: async () => payload } as any);
    expect(addOrder).toHaveBeenCalledWith("bcd", "sess", 10, "2030-05-05");
    expect(res.status).toBe(200);
  });

  test("charge.refunded marks order refunded", async () => {
    const markRefunded = jest.fn();
    jest.doMock(
      "@platform-core/repositories/rentalOrders.server",
      () => ({
        __esModule: true,
        addOrder: jest.fn(),
        markRefunded,
      }),
      { virtual: true }
    );

    const { POST } = await import("../src/api/stripe-webhook/route");
    const payload = {
      type: "charge.refunded",
      data: {
        object: {
          id: "ch_1",
          payment_intent: {
            charges: { data: [{ invoice: "sess_2" }] },
          },
        },
      },
    } as any;
    const res = await POST({ json: async () => payload } as any);
    expect(markRefunded).toHaveBeenCalledWith("bcd", "sess_2");
    expect(res.status).toBe(200);
  });
});
