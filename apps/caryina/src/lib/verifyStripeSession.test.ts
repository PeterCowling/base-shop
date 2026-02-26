import { verifyStripeSession } from "./verifyStripeSession";

jest.mock("@acme/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        retrieve: jest.fn(),
      },
    },
  },
}));

const { stripe } = jest.requireMock("@acme/stripe") as {
  stripe: { checkout: { sessions: { retrieve: jest.Mock } } };
};

describe("verifyStripeSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("TC-02: paid session returns paid=true with amount and currency", async () => {
    stripe.checkout.sessions.retrieve.mockResolvedValue({
      id: "cs_test_123",
      payment_status: "paid",
      amount_total: 5000,
      currency: "eur",
    });
    const result = await verifyStripeSession("cs_test_123");
    expect(result.paid).toBe(true);
    expect(result.amount).toBe(5000);
    expect(result.currency).toBe("eur");
  });

  it("TC-03: unpaid session returns paid=false", async () => {
    stripe.checkout.sessions.retrieve.mockResolvedValue({
      id: "cs_test_456",
      payment_status: "unpaid",
      amount_total: 5000,
      currency: "eur",
    });
    const result = await verifyStripeSession("cs_test_456");
    expect(result.paid).toBe(false);
  });
});
