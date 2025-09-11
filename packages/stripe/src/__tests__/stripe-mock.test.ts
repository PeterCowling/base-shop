/** @jest-environment node */
// packages/stripe/src/__tests__/stripe-mock.test.ts

describe("stripe mock", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, STRIPE_USE_MOCK: "true" } as NodeJS.ProcessEnv;
    jest.doMock("@acme/config/env/core", () => ({
      coreEnv: { STRIPE_SECRET_KEY: undefined },
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = OLD_ENV;
  });

  it("imports without error and logs mock call", async () => {
    const infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});

    const importPromise = import("../index.ts");
    await expect(importPromise).resolves.toBeDefined();

    const { stripe } = await importPromise;
    const session = await stripe.checkout.sessions.create({} as any);

    expect(session).toMatchObject({
      id: "cs_test_mock",
      url: "https://example.com/mock-session",
    });

    expect(infoSpy).toHaveBeenCalledWith(
      "[stripe-mock] checkout.sessions.create",
      expect.anything()
    );
  });

  it("updates payment intent using mock and logs call", async () => {
    const infoSpy = jest.spyOn(console, "info").mockImplementation(() => {});

    const { stripe } = await import("../index.ts");
    const paymentIntent = await stripe.paymentIntents.update("pi_123", {
      amount: 2000,
    });

    expect(paymentIntent).toMatchObject({ id: "pi_123", amount: 2000 });
    expect(infoSpy).toHaveBeenCalledWith(
      "[stripe-mock] paymentIntents.update",
      "pi_123",
      { amount: 2000 }
    );
  });
});
