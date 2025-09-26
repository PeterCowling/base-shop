import Stripe from "stripe";

/**
 * Extend Stripe type to access internal helpers for testing.
 */
type StripeInternal = Stripe & {
  getApiField(field: string): unknown;
};

describe("stripe edge client", () => {
  const OLD_ENV = { ...process.env };

  // No special setup required; fetch and other APIs are polyfilled in test setup.

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV } as NodeJS.ProcessEnv;
    // Ensure the core env mock resolves a real secret so our Stripe client
    // is constructed (not the local mock implementation).
    (process.env as Record<string, string>).STRIPE_SECRET_KEY = "sk_test_123";
    // Force real client (jest.setup.ts defaults STRIPE_USE_MOCK to "true").
    (process.env as Record<string, string>).STRIPE_USE_MOCK = "false";
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_123";
    // Provide explicit mock for @acme/config/env/core since the shared test
    // mock only exposes a subset of keys (and does not include STRIPE_SECRET_KEY).
    jest.doMock("@acme/config/env/core", () => ({
      coreEnv: { STRIPE_SECRET_KEY: "sk_test_123" },
    }));
  });

  afterEach(() => {
    process.env = OLD_ENV as NodeJS.ProcessEnv;
    jest.restoreAllMocks();
  });

  it("uses fetch http client and performs request", async () => {
    // Mock fetch to simulate a successful Stripe API response.
    const fetchSpy = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({ id: "cus_test", object: "customer" }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          }
        )
      );

    const { stripe } = await import("../index");
    const stripeInternal = stripe as StripeInternal;

    // Ensure our client uses the fetch-based HTTP client.
    const httpClient = stripeInternal.getApiField("httpClient");
    expect(httpClient).toHaveProperty("_fetchFn");

    const customer = await stripeInternal.customers.create();
    expect(customer.id).toBe("cus_test");
    expect(fetchSpy).toHaveBeenCalled();
  });
});
