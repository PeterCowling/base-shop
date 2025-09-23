import type Stripe from "stripe";

describe("webhookHandlers/chargeRefunded", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("uses extractSessionIdFromCharge when available", async () => {
    const markRefunded = jest.fn().mockResolvedValue(undefined);
    const extractSessionIdFromCharge = jest.fn().mockReturnValue("in_abc");
    jest.doMock("../../orders/refunds", () => ({ markRefunded }));
    jest.doMock("../../helpers/risk", () => ({ extractSessionIdFromCharge }));

    const handler = (require("../chargeRefunded").default) as typeof import("../chargeRefunded").default;
    const charge = { id: "ch_1" } as unknown as Stripe.Charge;
    const event = { data: { object: charge } } as unknown as Stripe.Event;

    await handler("shop1", event);
    expect(markRefunded).toHaveBeenCalledWith("shop1", "in_abc");
  });

  test("falls back to charge.id when extract returns undefined", async () => {
    const markRefunded = jest.fn().mockResolvedValue(undefined);
    const extractSessionIdFromCharge = jest.fn().mockReturnValue(undefined);
    jest.doMock("../../orders/refunds", () => ({ markRefunded }));
    jest.doMock("../../helpers/risk", () => ({ extractSessionIdFromCharge }));

    const handler = (require("../chargeRefunded").default) as typeof import("../chargeRefunded").default;
    const charge = { id: "ch_2" } as unknown as Stripe.Charge;
    const event = { data: { object: charge } } as unknown as Stripe.Event;

    await handler("shop2", event);
    expect(markRefunded).toHaveBeenCalledWith("shop2", "ch_2");
  });
});

