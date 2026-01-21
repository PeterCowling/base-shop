/** @jest-environment node */
// packages/stripe/src/__tests__/stripe-use-mock-env.test.ts

describe("STRIPE_USE_MOCK environment variable", () => {
  const OLD_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    process.env = OLD_ENV;
  });

  it("uses real Stripe client when STRIPE_USE_MOCK='TRUE'", async () => {
    process.env = { ...OLD_ENV, STRIPE_USE_MOCK: "TRUE" } as NodeJS.ProcessEnv;

    const StripeCtor = jest.fn().mockImplementation(() => ({})) as jest.Mock & { createFetchHttpClient: jest.Mock };
    const httpClient = {};
    StripeCtor.createFetchHttpClient = jest.fn().mockReturnValue(httpClient);

    jest.doMock("stripe", () => ({ __esModule: true, default: StripeCtor }));
    jest.doMock("@acme/config/env/core", () => ({
      coreEnv: { STRIPE_SECRET_KEY: "sk_test_123" },
    }));

    await import("../index.ts");

    expect(StripeCtor).toHaveBeenCalledWith("sk_test_123", {
      apiVersion: "2025-06-30.basil",
      httpClient,
    });
  });

  it("activates mock client only when STRIPE_USE_MOCK is exactly 'true'", async () => {
    process.env = { ...OLD_ENV, STRIPE_USE_MOCK: "true" } as NodeJS.ProcessEnv;

    const StripeCtor = jest.fn();
    jest.doMock("stripe", () => ({ __esModule: true, default: StripeCtor }));
    jest.doMock("@acme/config/env/core", () => ({
      coreEnv: { STRIPE_SECRET_KEY: undefined },
    }));

    const { stripe } = await import("../index.ts");

    expect(StripeCtor).not.toHaveBeenCalled();
    expect(typeof stripe.checkout.sessions.create).toBe("function");
  });
});

