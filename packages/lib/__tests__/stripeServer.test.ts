import nock from "nock";

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
    const { stripe } = await import("../stripeServer");
    const stripeAny = stripe as any;
    expect(stripeAny.getApiField("version")).toBe("2025-05-28.basil");
    const httpClient = stripeAny.getApiField("httpClient");
    expect(httpClient).toBeDefined();
    expect(typeof httpClient).toBe("object");
    expect(httpClient).toHaveProperty("_fetchFn");
  });

  it("performs requests successfully with mocked API", async () => {
    const { stripe } = await import("../stripeServer");
    const stripeAny = stripe as any;
    const scope = nock("https://api.stripe.com")
      .post("/v1/customers")
      .reply(200, { id: "cus_test", object: "customer" });

    const customer = await stripeAny.customers.create();
    expect(customer.id).toBe("cus_test");
    expect(scope.isDone()).toBe(true);
  });
});
