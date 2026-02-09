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
        shopId: "bcd",
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
      } as any;
      const constructEvent = jest.fn().mockReturnValue(payload);
      jest.doMock("@acme/stripe", () => ({
        __esModule: true,
        stripe: { webhooks: { constructEvent } },
      }));

      const { POST } = await import("../src/api/stripe-webhook/route");
      const body = JSON.stringify(payload);
      const res = await POST({
        text: async () => body,
        headers: new Headers({ "stripe-signature": "sig" }),
      } as any);
      expect(constructEvent).toHaveBeenCalledWith(
        body,
        "sig",
        "whsec_test"
      );
      expect(handleStripeWebhook).toHaveBeenCalledWith("bcd", payload);
      expect(res.status).toBe(200);
    });

    test("returns 403 and does not process when tenant mismatch is detected", async () => {
      // Suppress expected console.error from "[stripe-webhook] tenant mismatch"
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      const handleStripeWebhook = jest.fn();
      const assertStripeWebhookTenant = jest.fn(async () => ({
        ok: false as const,
        status: 403 as const,
        reason: "mismatch" as const,
        expectedShopId: "bcd",
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

      const payload = { type: "checkout.session.completed", data: { object: {} } } as any;
      const constructEvent = jest.fn().mockReturnValue(payload);
      jest.doMock("@acme/stripe", () => ({
        __esModule: true,
        stripe: { webhooks: { constructEvent } },
      }));

      const { POST } = await import("../src/api/stripe-webhook/route");
      const body = JSON.stringify(payload);
      const res = await POST({
        text: async () => body,
        headers: new Headers({ "stripe-signature": "sig" }),
      } as any);

      expect(res.status).toBe(403);
      expect(handleStripeWebhook).not.toHaveBeenCalled();
      expect(recordMetric).toHaveBeenCalledWith(
        "webhook_tenant_mismatch_total",
        { shopId: "bcd", service: "template-app" },
        1,
      );

      errorSpy.mockRestore();
    });

    test("returns 503 and does not process when tenant is unresolvable", async () => {
      const handleStripeWebhook = jest.fn();
      const assertStripeWebhookTenant = jest.fn(async () => ({
        ok: false as const,
        status: 503 as const,
        reason: "unresolvable" as const,
        expectedShopId: "bcd",
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

      const payload = { type: "checkout.session.completed", data: { object: {} } } as any;
      const constructEvent = jest.fn().mockReturnValue(payload);
      jest.doMock("@acme/stripe", () => ({
        __esModule: true,
        stripe: { webhooks: { constructEvent } },
      }));

      const { POST } = await import("../src/api/stripe-webhook/route");
      const res = await POST({
        text: async () => JSON.stringify(payload),
        headers: new Headers({ "stripe-signature": "sig" }),
      } as any);

      expect(res.status).toBe(503);
      expect(handleStripeWebhook).not.toHaveBeenCalled();
      expect(recordMetric).toHaveBeenCalledWith(
        "webhook_tenant_unresolvable_total",
        { shopId: "bcd", service: "template-app" },
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
      const res = await POST({
        text: async () => "{}",
        headers: new Headers({ "stripe-signature": "sig" }),
      } as any);
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
      const res = await POST({
        text: async () => "{}",
        headers: new Headers(),
      } as any);
      expect(res.status).toBe(400);
      expect(handleStripeWebhook).not.toHaveBeenCalled();
    });
  });
