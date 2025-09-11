/** @jest-environment node */
// packages/stripe/src/__tests__/stripe-mock.test.ts

describe("stripe mock client", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, STRIPE_USE_MOCK: "true" } as NodeJS.ProcessEnv;
    delete (process.env as Record<string, string | undefined>).STRIPE_SECRET_KEY;
    jest.doMock("@acme/config/env/core", () => ({ coreEnv: {} }));
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  it("merges params and logs paymentIntents.update calls", async () => {
    const infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});
    const { stripe } = await import("../index.ts");

    const result = await stripe.paymentIntents.update("pi_123", { amount: 2000 });

    expect(result).toEqual({
      id: "pi_123",
      object: "payment_intent",
      amount: 2000,
    });
    expect(infoSpy).toHaveBeenCalledWith(
      "[stripe-mock] paymentIntents.update",
      "pi_123",
      { amount: 2000 },
    );
  });
});
