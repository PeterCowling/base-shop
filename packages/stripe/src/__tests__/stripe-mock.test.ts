/** @jest-environment node */
// packages/stripe/src/__tests__/stripe-mock.test.ts

describe("stripe mock client", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, STRIPE_USE_MOCK: "true" } as NodeJS.ProcessEnv;
    delete (process.env as Record<string, string | undefined>).STRIPE_SECRET_KEY;
    jest.doMock("@acme/config/env/core", () => ({
      coreEnv: { STRIPE_SECRET_KEY: undefined },
    }));
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  it("initializes mock client without secret key", async () => {
    const { stripe } = await import("../index.ts");
    const session = await stripe.checkout.sessions.create({});
    expect(session).toHaveProperty("id", "cs_test_mock");
  });
});

