import Stripe from "stripe";
import { Miniflare } from "miniflare";

/**
 * Extend Stripe type to access internal helpers for testing.
 */
type StripeInternal = Stripe & {
  getApiField(field: string): unknown;
};

describe("stripe edge client", () => {
  const OLD_ENV = process.env;

  beforeAll(async () => {
    // Create a Cloudflare Worker-like environment via Miniflare.
    const mf = new Miniflare();
    const scope = await mf.getGlobalScope();
    Object.assign(globalThis, {
      fetch: scope.fetch,
      Headers: scope.Headers,
      Request: scope.Request,
      Response: scope.Response,
      FormData: scope.FormData,
    });
  });

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...OLD_ENV,
      STRIPE_SECRET_KEY: "sk_test_123",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_123",
    } as NodeJS.ProcessEnv;
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  it("uses fetch http client and performs request", async () => {
    const { stripe } = await import("../index");
    const stripeInternal = stripe as StripeInternal;

    // Ensure our client uses the fetch-based HTTP client.
    const httpClient = stripeInternal.getApiField("httpClient");
    expect(httpClient).toHaveProperty("_fetchFn");

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

    const customer = await stripeInternal.customers.create();
    expect(customer.id).toBe("cus_test");
    expect(fetchSpy).toHaveBeenCalled();
  });
});

