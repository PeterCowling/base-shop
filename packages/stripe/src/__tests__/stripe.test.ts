// packages/stripe/src/__tests__/stripe.test.ts
import type Stripe from "stripe";
import { rest } from "msw";
import { server } from "../../../../test/msw/server";

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
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_123",
    } as NodeJS.ProcessEnv;
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  it("uses expected API version and fetch client", async () => {
    const { stripe } = await import("../index");
    const stripeInternal = stripe as StripeInternal;

    expect(stripeInternal.getApiField("version")).toBe("2025-06-30.basil");

    const httpClient = stripeInternal.getApiField("httpClient");
    expect(typeof httpClient).toBe("object");
    expect(httpClient).toHaveProperty("_fetchFn");
  });

  it("performs requests successfully with mocked API", async () => {
    const { stripe } = await import("../index");
    const stripeInternal = stripe as StripeInternal;

    let called = false;
    server.use(
      rest.post(
        "https://api.stripe.com/v1/customers",
        (_req, res, ctx) => {
          called = true;
          return res(
            ctx.status(200),
            ctx.json({ id: "cus_test", object: "customer" })
          );
        }
      )
    );

    const customer = await stripeInternal.customers.create();
    expect(customer.id).toBe("cus_test");
    expect(called).toBe(true);
  });

  it("throws when Stripe API responds with an error", async () => {
    const { stripe } = await import("../index");
    const stripeInternal = stripe as StripeInternal;

    const httpClient = stripeInternal.getApiField("httpClient") as {
      _fetchFn: typeof fetch;
    };
    expect(httpClient).toHaveProperty("_fetchFn");
    const fetchSpy = jest.spyOn(httpClient, "_fetchFn");

    let called = false;
    server.use(
      rest.post(
        "https://api.stripe.com/v1/customers",
        (_req, res, ctx) => {
          called = true;
          return res(
            ctx.status(400),
            ctx.json({ error: { message: "Invalid request" } })
          );
        }
      )
    );

    await expect(stripeInternal.customers.create()).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid request",
    });

    expect(fetchSpy).toHaveBeenCalled();
    expect(called).toBe(true);
  });

  it("errors when STRIPE_SECRET_KEY is undefined", async () => {
    delete (process.env as Record<string, string | undefined>).STRIPE_SECRET_KEY;
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.doMock("@acme/config/env/payments", () => ({
      paymentsEnv: { STRIPE_SECRET_KEY: undefined },
    }));

    await expect(
      import("../index").catch((err) => {
        console.error((err as Error).message);
        throw err;
      }),
    ).rejects.toThrow("Neither apiKey nor config.authenticator provided");

    expect(spy).toHaveBeenCalledWith(
      "Neither apiKey nor config.authenticator provided",
    );
  });

  it("errors when STRIPE_SECRET_KEY is empty", async () => {
    (process.env as Record<string, string>).STRIPE_SECRET_KEY = "";
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.doMock("@acme/config/env/payments", () => ({
      paymentsEnv: { STRIPE_SECRET_KEY: "" },
    }));

    await expect(
      import("../index").catch((err) => {
        console.error((err as Error).message);
        throw err;
      }),
    ).rejects.toThrow("Neither apiKey nor config.authenticator provided");

    expect(spy).toHaveBeenCalledWith(
      "Neither apiKey nor config.authenticator provided",
    );
  });
});
