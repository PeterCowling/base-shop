import { describe, it, expect } from "@jest/globals";
import { withEnv } from "../../../test/utils/withEnv";

describe("env matrix scenarios", () => {
  it("payments sandbox, email noop, no redis", async () => {
    await withEnv(
      {
        PAYMENTS_SANDBOX: "true",
        EMAIL_PROVIDER: "noop",
        SHIPPING_PROVIDER: "none",
        SESSION_STORE: undefined,
        UPSTASH_REDIS_REST_URL: undefined,
        UPSTASH_REDIS_REST_TOKEN: undefined,
      },
      async () => {
        const { paymentsEnv } = await import("../payments");
        const { emailEnv } = await import("../email");
        const { shippingEnv } = await import("../shipping");
        const { cmsEnv } = await import("../cms");
        const { authEnv } = await import("../auth");

        expect(paymentsEnv.PAYMENTS_SANDBOX).toBe(true);
        expect(emailEnv.EMAIL_PROVIDER).toBe("noop");
        expect(shippingEnv.SHIPPING_PROVIDER).toBe("none");
        expect(cmsEnv.CMS_PAGINATION_LIMIT).toBe(100);
        expect(authEnv.SESSION_STORE).toBeUndefined();
      },
    );
  });

  it("stripe + resend + redis", async () => {
    await withEnv(
      {
        PAYMENTS_PROVIDER: "stripe",
        PAYMENTS_SANDBOX: "false",
        STRIPE_SECRET_KEY: "sk_live_123",
        STRIPE_WEBHOOK_SECRET: "whsec_live_123",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_live_123",
        EMAIL_FROM: "from@example.com",
        EMAIL_PROVIDER: "resend",
        RESEND_API_KEY: "re_key",
        SHIPPING_PROVIDER: "shippo",
        FREE_SHIPPING_THRESHOLD: "50",
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: "https://redis.example.com",
        UPSTASH_REDIS_REST_TOKEN: "strongtokenstrongtokenstrongtoken!!",
        CMS_DRAFTS_ENABLED: "true",
      },
      async () => {
        const { paymentsEnv } = await import("../payments");
        const { emailEnv } = await import("../email");
        const { shippingEnv } = await import("../shipping");
        const { cmsEnv } = await import("../cms");
        const { authEnv } = await import("../auth");

        expect(paymentsEnv.PAYMENTS_PROVIDER).toBe("stripe");
        expect(paymentsEnv.PAYMENTS_SANDBOX).toBe(false);
        expect(emailEnv.EMAIL_PROVIDER).toBe("resend");
        expect(shippingEnv.SHIPPING_PROVIDER).toBe("shippo");
        expect(shippingEnv.FREE_SHIPPING_THRESHOLD).toBe(50);
        expect(cmsEnv.CMS_DRAFTS_ENABLED).toBe(true);
        expect(authEnv.SESSION_STORE).toBe("redis");
        expect(authEnv.UPSTASH_REDIS_REST_URL).toBe(
          "https://redis.example.com",
        );
      },
    );
  });

  it("sendgrid + currency + shipping options", async () => {
    await withEnv(
      {
        EMAIL_FROM: "from@example.com",
        EMAIL_PROVIDER: "sendgrid",
        SENDGRID_API_KEY: "sg_key",
        PAYMENTS_SANDBOX: "false",
        PAYMENTS_CURRENCY: "EUR",
        SHIPPING_PROVIDER: "external",
        ALLOWED_COUNTRIES: "US, it ,de",
        LOCAL_PICKUP_ENABLED: "true",
        DEFAULT_COUNTRY: "ca",
        FREE_SHIPPING_THRESHOLD: "75",
        CMS_SEARCH_ENABLED: "true",
        CMS_SEARCH_DISABLED_PATHS: "/foo,/bar ",
      },
      async () => {
        const { emailEnv } = await import("../email");
        const { paymentsEnv } = await import("../payments");
        const { shippingEnv } = await import("../shipping");
        const { cmsEnv } = await import("../cms");

        expect(emailEnv.EMAIL_PROVIDER).toBe("sendgrid");
        expect(paymentsEnv.PAYMENTS_CURRENCY).toBe("EUR");
        expect(paymentsEnv.PAYMENTS_SANDBOX).toBe(false);
        expect(shippingEnv.ALLOWED_COUNTRIES).toEqual(["US", "IT", "DE"]);
        expect(shippingEnv.LOCAL_PICKUP_ENABLED).toBe(true);
        expect(shippingEnv.DEFAULT_COUNTRY).toBe("CA");
        expect(shippingEnv.FREE_SHIPPING_THRESHOLD).toBe(75);
        expect(cmsEnv.CMS_SEARCH_ENABLED).toBe(true);
        expect(cmsEnv.CMS_SEARCH_DISABLED_PATHS).toEqual(["/foo", "/bar"]);
      },
    );
  });
});
