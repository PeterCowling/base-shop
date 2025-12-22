import { jest } from "@jest/globals";
import { importExternalOrder } from "../src/orders/externalImport";

const addOrder = jest.fn();

jest.mock("../src/orders/creation", () => ({
  addOrder: (...args: unknown[]) => (addOrder as any)(...args),
}));

describe("importExternalOrder", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("normalizes amounts and strings and passes through to addOrder", async () => {
    addOrder.mockResolvedValue({ id: "ord_1" });

    const result = await importExternalOrder({
      shop: "shop-1",
      sessionId: "cs_test",
      amountTotal: 1234,
      currency: "usd",
      paymentIntentId: "pi_1",
      stripeCustomerId: "cus_1",
      cartId: "cart_1",
      orderId: "order_1",
      internalCustomerId: "cust_internal",
    });

    expect(addOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        shop: "shop-1",
        sessionId: "cs_test",
        deposit: 1234,
        totalAmount: 1234,
        currency: "USD",
        cartId: "cart_1",
        customerId: "cust_internal",
        stripePaymentIntentId: "pi_1",
        stripeCustomerId: "cus_1",
        orderId: "order_1",
      }),
    );
    expect(result).toEqual({ id: "ord_1" });
  });

  it("defaults missing/invalid amounts to zero", async () => {
    addOrder.mockResolvedValue({ id: "ord_2" });
    await importExternalOrder({
      shop: "shop-1",
      sessionId: "cs_test",
      amountTotal: "not-a-number" as unknown as number,
    });
    expect(addOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        deposit: 0,
        totalAmount: 0,
      }),
    );
  });
});
