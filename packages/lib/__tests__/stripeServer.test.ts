// packages/lib/__tests__/stripeServer.test.ts
import nock from "nock";
import type Stripe from "stripe";

/**
 * Our Stripe singleton is fully typed, but the test needs access to an
 * **internal** helper (`getApiField`) that isn’t exposed in Stripe’s public
 * .d.ts file.  We extend the type locally so we can call it without using
 * `any`, keeping eslint happy.
 */
type StripeInternal = Stripe & {
  getApiField(field: string): unknown;
};

describe("stripe client", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...OLD_ENV,
      STRIPE_SECRET_KEY: "sk_test_123",
    } as NodeJS.ProcessEnv;
  });

  afterEach(() => {
    process.env = OLD_ENV;
    nock.cleanAll();
  });

  it("uses expected API version and fetch client", async () => {
    const { stripe } = await import("@lib/stripeServer");
    const stripeInternal = stripe as StripeInternal;

    expect(stripeInternal.getApiField("version")).toBe("2025-05-28.basil");

    const httpClient = stripeInternal.getApiField("httpClient");
    expect(typeof httpClient).toBe("object");
    expect(httpClient).toHaveProperty("_fetchFn");
  });

  it("performs requests successfully with mocked API", async () => {
    const { stripe } = await import("@lib/stripeServer");
    const stripeInternal = stripe as StripeInternal;

    const scope = nock("https://api.stripe.com")
      .post("/v1/customers")
      .reply(200, { id: "cus_test", object: "customer" });

    const customer = await stripeInternal.customers.create();
    expect(customer.id).toBe("cus_test");
    expect(scope.isDone()).toBe(true);
  });
});
