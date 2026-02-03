import { jest } from "@jest/globals";
process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";


afterEach(() => jest.resetModules());

describe("/api/stripe-webhook", () => {
  test("verifies signature and forwards events", async () => {
    const handleStripeWebhook = jest.fn();
    const assertStripeWebhookTenant = jest.fn(async () => ({
      ok: true as const,
      shopId: "cover-me-pretty",
    }));
    const recordMetric = jest.fn();
    jest.doMock(
      "@acme/platform-core/stripe-webhook",
      () => ({ __esModule: true, handleStripeWebhook }),
      { virtual: true }
    );
    jest.doMock(
      "@acme/platform-core/stripeTenantResolver",
      () => ({ __esModule: true, assertStripeWebhookTenant }),
      { virtual: true },
    );
    jest.doMock(
      "@acme/platform-core/utils",
      () => ({ __esModule: true, recordMetric }),
      { virtual: true },
    );
    const payload = {
      type: "checkout.session.completed",
      data: { object: {} },
    };
    const constructEvent = jest.fn().mockReturnValue(payload);
    jest.doMock("@acme/stripe", () => ({
      __esModule: true,
      stripe: { webhooks: { constructEvent } },
    }));

    const { POST } = await import("../src/api/stripe-webhook/route");
    const body = JSON.stringify(payload);
    const req = new Request("http://example.com/api/stripe-webhook", {
      method: "POST",
      headers: new Headers({ "stripe-signature": "sig" }),
      body,
    });
    const res = await POST(req);
    expect(constructEvent).toHaveBeenCalledWith(
      body,
      "sig",
      "whsec_test"
    );
    expect(handleStripeWebhook).toHaveBeenCalledWith("cover-me-pretty", payload);
    expect(res.status).toBe(200);
  });

  test("returns 403 and does not process when tenant mismatch is detected", async () => {
    const handleStripeWebhook = jest.fn();
    const assertStripeWebhookTenant = jest.fn(async () => ({
      ok: false as const,
      status: 403 as const,
      reason: "mismatch" as const,
      expectedShopId: "cover-me-pretty",
      resolvedShopId: "other-shop",
    }));
    const recordMetric = jest.fn();
    jest.doMock(
      "@acme/platform-core/stripe-webhook",
      () => ({ __esModule: true, handleStripeWebhook }),
      { virtual: true }
    );
    jest.doMock(
      "@acme/platform-core/stripeTenantResolver",
      () => ({ __esModule: true, assertStripeWebhookTenant }),
      { virtual: true },
    );
    jest.doMock(
      "@acme/platform-core/utils",
      () => ({ __esModule: true, recordMetric }),
      { virtual: true },
    );

    const payload = { type: "checkout.session.completed", data: { object: {} } };
    const constructEvent = jest.fn().mockReturnValue(payload);
    jest.doMock("@acme/stripe", () => ({
      __esModule: true,
      stripe: { webhooks: { constructEvent } },
    }));

    const { POST } = await import("../src/api/stripe-webhook/route");
    const body = JSON.stringify(payload);
    const req = new Request("http://example.com/api/stripe-webhook", {
      method: "POST",
      headers: new Headers({ "stripe-signature": "sig" }),
      body,
    });
    const res = await POST(req);

    expect(res.status).toBe(403);
    expect(handleStripeWebhook).not.toHaveBeenCalled();
    expect(recordMetric).toHaveBeenCalledWith(
      "webhook_tenant_mismatch_total",
      { shopId: "cover-me-pretty", service: "cover-me-pretty" },
      1,
    );
  });

  test("returns 503 and does not process when tenant is unresolvable", async () => {
    const handleStripeWebhook = jest.fn();
    const assertStripeWebhookTenant = jest.fn(async () => ({
      ok: false as const,
      status: 503 as const,
      reason: "unresolvable" as const,
      expectedShopId: "cover-me-pretty",
    }));
    const recordMetric = jest.fn();
    jest.doMock(
      "@acme/platform-core/stripe-webhook",
      () => ({ __esModule: true, handleStripeWebhook }),
      { virtual: true }
    );
    jest.doMock(
      "@acme/platform-core/stripeTenantResolver",
      () => ({ __esModule: true, assertStripeWebhookTenant }),
      { virtual: true },
    );
    jest.doMock(
      "@acme/platform-core/utils",
      () => ({ __esModule: true, recordMetric }),
      { virtual: true },
    );

    const payload = { type: "checkout.session.completed", data: { object: {} } };
    const constructEvent = jest.fn().mockReturnValue(payload);
    jest.doMock("@acme/stripe", () => ({
      __esModule: true,
      stripe: { webhooks: { constructEvent } },
    }));

    const { POST } = await import("../src/api/stripe-webhook/route");
    const body = JSON.stringify(payload);
    const req = new Request("http://example.com/api/stripe-webhook", {
      method: "POST",
      headers: new Headers({ "stripe-signature": "sig" }),
      body,
    });
    const res = await POST(req);

    expect(res.status).toBe(503);
    expect(handleStripeWebhook).not.toHaveBeenCalled();
    expect(recordMetric).toHaveBeenCalledWith(
      "webhook_tenant_unresolvable_total",
      { shopId: "cover-me-pretty", service: "cover-me-pretty" },
      1,
    );
  });

  test("returns 400 for invalid signature", async () => {
    const handleStripeWebhook = jest.fn();
    const assertStripeWebhookTenant = jest.fn();
    const recordMetric = jest.fn();
    jest.doMock(
      "@acme/platform-core/stripe-webhook",
      () => ({ __esModule: true, handleStripeWebhook }),
      { virtual: true }
    );
    jest.doMock(
      "@acme/platform-core/stripeTenantResolver",
      () => ({ __esModule: true, assertStripeWebhookTenant }),
      { virtual: true },
    );
    jest.doMock(
      "@acme/platform-core/utils",
      () => ({ __esModule: true, recordMetric }),
      { virtual: true },
    );
    const constructEvent = jest.fn(() => {
      throw new Error("bad");
    });
    jest.doMock("@acme/stripe", () => ({
      __esModule: true,
      stripe: { webhooks: { constructEvent } },
    }));

    const { POST } = await import("../src/api/stripe-webhook/route");
    const req = new Request("http://example.com/api/stripe-webhook", {
      method: "POST",
      headers: new Headers({ "stripe-signature": "sig" }),
      body: "{}",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(handleStripeWebhook).not.toHaveBeenCalled();
  });

  test("returns 400 when signature header is missing", async () => {
    const handleStripeWebhook = jest.fn();
    const assertStripeWebhookTenant = jest.fn();
    const recordMetric = jest.fn();
    jest.doMock(
      "@acme/platform-core/stripe-webhook",
      () => ({ __esModule: true, handleStripeWebhook }),
      { virtual: true }
    );
    jest.doMock(
      "@acme/platform-core/stripeTenantResolver",
      () => ({ __esModule: true, assertStripeWebhookTenant }),
      { virtual: true },
    );
    jest.doMock(
      "@acme/platform-core/utils",
      () => ({ __esModule: true, recordMetric }),
      { virtual: true },
    );
    const constructEvent = jest.fn((_: string, sig: string) => {
      if (!sig) {
        throw new Error("missing signature");
      }
    });
    jest.doMock("@acme/stripe", () => ({
      __esModule: true,
      stripe: { webhooks: { constructEvent } },
    }));

    const { POST } = await import("../src/api/stripe-webhook/route");
    const req = new Request("http://example.com/api/stripe-webhook", {
      method: "POST",
      headers: new Headers(),
      body: "{}",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(handleStripeWebhook).not.toHaveBeenCalled();
  });
});
