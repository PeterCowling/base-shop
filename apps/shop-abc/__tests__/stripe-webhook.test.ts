// Jest globals are available automatically – no import needed
process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

afterEach(() => jest.resetModules());

describe("/api/stripe-webhook", () => {
  test("checkout.session.completed creates an order", async () => {
    const addOrder = jest.fn();
    jest.doMock(
      "@platform-core/orders",
      () => ({
        __esModule: true,
        addOrder,
        markRefunded: jest.fn(),
      }),
      { virtual: true }
    );

    const payload = {
      type: "checkout.session.completed",
      data: {
        object: {
          id: "sess",
          metadata: { depositTotal: "10", returnDate: "2030-05-05" },
        },
      },
    } as any;
    jest.doMock(
      "@acme/stripe",
      () => ({
        stripe: { webhooks: { constructEvent: () => payload } },
      }),
      { virtual: true }
    );

    const { POST } = await import("../src/app/api/stripe-webhook/route");
    const body = JSON.stringify(payload);
    const res = await POST({
      text: async () => body,
      headers: { get: () => "sig" },
    } as any);
    expect(addOrder).toHaveBeenCalledWith(
      "abc",
      "sess",
      10,
      "2030-05-05",
      undefined,
    );
    expect(res.status).toBe(200);
  });

  test("charge.refunded marks order refunded", async () => {
    const markRefunded = jest.fn();
    jest.doMock(
      "@platform-core/orders",
      () => ({
        __esModule: true,
        addOrder: jest.fn(),
        markRefunded,
      }),
      { virtual: true }
    );

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
    jest.doMock(
      "@acme/stripe",
      () => ({
        stripe: { webhooks: { constructEvent: () => payload } },
      }),
      { virtual: true }
    );

    const { POST } = await import("../src/app/api/stripe-webhook/route");
    const body = JSON.stringify(payload);
    const res = await POST({
      text: async () => body,
      headers: { get: () => "sig" },
    } as any);
    expect(markRefunded).toHaveBeenCalledWith("abc", "sess_2");
    expect(res.status).toBe(200);
  });
});
