/** @jest-environment node */
// packages/stripe/src/__tests__/stripe.test.ts
import type Stripe from "stripe";
import { rest } from "~test/msw/shared";
import { server } from "~test/msw/server";

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
      AUTH_TOKEN_TTL: "15m",
    } as NodeJS.ProcessEnv;
    // Global test setup defaults STRIPE_USE_MOCK to "true" to keep most tests
    // isolated from Stripe. This suite verifies behavior of the real client,
    // so force the real implementation.
    (process.env as Record<string, string>).STRIPE_USE_MOCK = "false";
    jest.doMock("@acme/config/env/core", () => ({
      coreEnv: { STRIPE_SECRET_KEY: "sk_test_123" },
    }));
  });

  afterEach(() => {
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  it("uses expected API version and fetch client", async () => {
    const { stripe } = await import("../index.ts");
    const stripeInternal = stripe as StripeInternal;

    expect(stripeInternal.getApiField("version")).toBe("2025-06-30.basil");

    const httpClient = stripeInternal.getApiField("httpClient");
    expect(typeof httpClient).toBe("object");
    expect(httpClient).toHaveProperty("_fetchFn");
  });

  it("performs requests successfully with mocked API", async () => {
    const { stripe } = await import("../index.ts");
    const stripeInternal = stripe as StripeInternal;

    let called = false;
    server.use(
      rest.post("https://api.stripe.com/v1/customers", (_req, res, ctx) => {
        called = true;
        return res(
          ctx.status(200),
          ctx.json({ id: "cus_test", object: "customer" })
        );
      })
    );

    const customer = await stripeInternal.customers.create();
    expect(customer.id).toBe("cus_test");
    expect(called).toBe(true);
  });

  it("throws when Stripe API responds with an error", async () => {
    const { stripe } = await import("../index.ts");
    const stripeInternal = stripe as StripeInternal;

    const httpClient = stripeInternal.getApiField("httpClient") as {
      _fetchFn: typeof fetch;
    };
    expect(httpClient).toHaveProperty("_fetchFn");
    const fetchSpy = jest.spyOn(httpClient, "_fetchFn");

    let called = false;
    server.use(
      rest.post("https://api.stripe.com/v1/customers", (_req, res, ctx) => {
        called = true;
        return res(
          ctx.status(400),
          ctx.json({ error: { message: "Invalid request" } })
        );
      })
    );

    await expect(stripeInternal.customers.create()).rejects.toMatchObject({
      statusCode: 400,
      message: "Invalid request",
    });

    expect(fetchSpy).toHaveBeenCalled();
    expect(called).toBe(true);
  });

  it("rejects when network request fails", async () => {
    const { stripe } = await import("../index.ts");
    const stripeInternal = stripe as StripeInternal;

    const httpClient = stripeInternal.getApiField("httpClient") as {
      _fetchFn: typeof fetch;
    };
    expect(httpClient).toHaveProperty("_fetchFn");

    const fetchSpy = jest
      .spyOn(httpClient, "_fetchFn")
      .mockRejectedValue(new Error("network down"));

    await expect(
      stripeInternal.paymentIntents.update("pi_123", {
        metadata: { foo: "bar" },
      })
    ).rejects.toThrow("An error occurred with our connection to Stripe");
    expect(fetchSpy).toHaveBeenCalled();
  });

  it("errors when STRIPE_SECRET_KEY is undefined", async () => {
    delete (process.env as Record<string, string | undefined>)
      .STRIPE_SECRET_KEY;
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.doMock("@acme/config/env/core", () => ({
      coreEnv: { STRIPE_SECRET_KEY: undefined },
    }));

    await expect(
      import("../index.ts").catch((err) => {
        console.error((err as Error).message);
        throw err;
      })
    ).rejects.toThrow("Neither apiKey nor config.authenticator provided");

    expect(spy).toHaveBeenCalledWith(
      "Neither apiKey nor config.authenticator provided"
    );
  });

  it("errors when STRIPE_SECRET_KEY is empty", async () => {
    (process.env as Record<string, string>).STRIPE_SECRET_KEY = "";
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.doMock("@acme/config/env/core", () => ({
      coreEnv: { STRIPE_SECRET_KEY: "" },
    }));

    await expect(
      import("../index.ts").catch((err) => {
        console.error((err as Error).message);
        throw err;
      })
    ).rejects.toThrow("Neither apiKey nor config.authenticator provided");

    expect(spy).toHaveBeenCalledWith(
      "Neither apiKey nor config.authenticator provided"
    );
  });

  it("creates checkout session with expected payload", async () => {
    const { stripe } = await import("../index.ts");
    const stripeInternal = stripe as StripeInternal;

    let capturedBody = "";
    let capturedVersion = "";
    server.use(
      rest.post(
        "https://api.stripe.com/v1/checkout/sessions",
        async (req, res, ctx) => {
          capturedBody = await req.text();
          capturedVersion = req.headers.get("stripe-version") ?? "";
          return res(
            ctx.status(200),
            ctx.json({ id: "cs_test", object: "checkout.session" })
          );
        }
      )
    );

    const session = await stripeInternal.checkout.sessions.create({
      mode: "payment",
      success_url: "https://example.com/success",
      cancel_url: "https://example.com/cancel",
      line_items: [{ price: "price_123", quantity: 1 }],
    });

    expect(session.id).toBe("cs_test");
    expect(capturedVersion).toBe("2025-06-30.basil");
    const params = new URLSearchParams(capturedBody);
    expect(params.get("mode")).toBe("payment");
    expect(params.get("success_url")).toBe("https://example.com/success");
    expect(params.get("line_items[0][price]")).toBe("price_123");
    expect(params.get("line_items[0][quantity]")).toBe("1");
  });

  it("surfaces API errors when creating checkout session", async () => {
    const { stripe } = await import("../index.ts");
    const stripeInternal = stripe as StripeInternal;

    server.use(
      rest.post(
        "https://api.stripe.com/v1/checkout/sessions",
        (_req, res, ctx) =>
          res(ctx.status(400), ctx.json({ error: { message: "Bad request" } }))
      )
    );

    await expect(
      stripeInternal.checkout.sessions.create({
        mode: "payment",
        success_url: "https://example.com/success",
        cancel_url: "https://example.com/cancel",
        line_items: [{ price: "price_123", quantity: 1 }],
      })
    ).rejects.toMatchObject({ message: "Bad request", statusCode: 400 });
  });

  it("updates payment intent with expected payload", async () => {
    const { stripe } = await import("../index.ts");
    const stripeInternal = stripe as StripeInternal;

    let capturedBody = "";
    let capturedVersion = "";
    server.use(
      rest.post(
        "https://api.stripe.com/v1/payment_intents/pi_123",
        async (req, res, ctx) => {
          capturedBody = await req.text();
          capturedVersion = req.headers.get("stripe-version") ?? "";
          return res(
            ctx.status(200),
            ctx.json({
              id: "pi_123",
              object: "payment_intent",
              metadata: { foo: "bar" },
            })
          );
        }
      )
    );

    const paymentIntent = await stripeInternal.paymentIntents.update("pi_123", {
      metadata: { foo: "bar" },
    });

    expect(paymentIntent.id).toBe("pi_123");
    expect(capturedVersion).toBe("2025-06-30.basil");
    const params = new URLSearchParams(capturedBody);
    expect(params.get("metadata[foo]")).toBe("bar");
  });

  it("surfaces API errors when updating payment intent", async () => {
    const { stripe } = await import("../index.ts");
    const stripeInternal = stripe as StripeInternal;

    server.use(
      rest.post(
        "https://api.stripe.com/v1/payment_intents/pi_123",
        (_req, res, ctx) =>
          res(ctx.status(400), ctx.json({ error: { message: "Bad request" } }))
      )
    );

    await expect(
      stripeInternal.paymentIntents.update("pi_123", {
        metadata: { foo: "bar" },
      })
    ).rejects.toMatchObject({ message: "Bad request", statusCode: 400 });
  });

  it("constructs webhook events using Stripe helpers", async () => {
    const { stripe } = await import("../index.ts");
    const payload = JSON.stringify({
      id: "evt_test",
      object: "event",
      type: "checkout.session.completed",
      api_version: "2025-06-30.basil",
    });
    const secret = "whsec_test";
    const header = stripe.webhooks.generateTestHeaderString({
      payload,
      secret,
    });
    const event = stripe.webhooks.constructEvent(payload, header, secret);

    expect(event.id).toBe("evt_test");
    expect(event.type).toBe("checkout.session.completed");
    expect((event as { api_version: string }).api_version).toBe(
      "2025-06-30.basil"
    );
  });

  it("throws when webhook signature doesn't match payload", async () => {
    const { stripe } = await import("../index.ts");
    const payload = JSON.stringify({
      id: "evt_test",
      object: "event",
      type: "checkout.session.completed",
      api_version: "2025-06-30.basil",
    });
    const secret = "whsec_test";
    const header = stripe.webhooks.generateTestHeaderString({
      payload,
      secret,
    });
    const tamperedPayload = JSON.stringify({
      id: "evt_test_tampered",
      object: "event",
      type: "checkout.session.completed",
      api_version: "2025-06-30.basil",
    });

    expect(() =>
      stripe.webhooks.constructEvent(tamperedPayload, header, secret)
    ).toThrow(stripe.errors.StripeSignatureVerificationError);
  });
});
