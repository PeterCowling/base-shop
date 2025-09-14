/** @jest-environment node */
import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

const ORIGINAL_ENV = { ...process.env };
const NEXTAUTH_SECRET = "nextauth-secret-32-chars-long-string!";
const SESSION_SECRET = "session-secret-32-chars-long-string!";

beforeEach(() => {
  process.env = {
    ...ORIGINAL_ENV,
    NEXTAUTH_SECRET,
    SESSION_SECRET,
    EMAIL_FROM: "from@example.com",
    EMAIL_PROVIDER: "smtp",
    CMS_SPACE_URL: "https://cms.example.com",
    CMS_ACCESS_TOKEN: "token",
    SANITY_API_VERSION: "v1",
    SANITY_PROJECT_ID: "project",
    SANITY_DATASET: "production",
    SANITY_API_TOKEN: "sanity-token",
    SANITY_PREVIEW_SECRET: "preview",
  } as NodeJS.ProcessEnv;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  jest.resetModules();
});

describe("auth env schema", () => {
  it("fails when session secret missing in production", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.JEST_WORKER_ID;
    jest.resetModules();
    const { authEnvSchema } = await import("@acme/config/env/auth");
    const result = authEnvSchema.safeParse({
      NEXTAUTH_SECRET,
    });
    expect(result.success).toBe(false);
  });

  it("applies development defaults", async () => {
    process.env.NODE_ENV = "development";
    jest.resetModules();
    const { authEnvSchema } = await import("@acme/config/env/auth");
    const parsed = authEnvSchema.parse({});
    expect(parsed.NEXTAUTH_SECRET).toBeDefined();
    expect(parsed.SESSION_SECRET).toBeDefined();
  });

  it("coerces booleans and rejects invalid TTL", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.JEST_WORKER_ID;
    jest.resetModules();
    const { authEnvSchema } = await import("@acme/config/env/auth");
    const ok = authEnvSchema.safeParse({
      NEXTAUTH_SECRET,
      SESSION_SECRET,
      ALLOW_GUEST: "1",
    });
    expect(ok.success).toBe(true);
    expect(ok.data?.ALLOW_GUEST).toBe(true);
    const bad = authEnvSchema.safeParse({
      NEXTAUTH_SECRET,
      SESSION_SECRET,
      AUTH_TOKEN_TTL: "1h",
    });
    expect(bad.success).toBe(false);
  });

  it("requires redis credentials when SESSION_STORE=redis", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.JEST_WORKER_ID;
    jest.resetModules();
    const { authEnvSchema } = await import("@acme/config/env/auth");
    const result = authEnvSchema.safeParse({
      NEXTAUTH_SECRET,
      SESSION_SECRET,
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_URL: "https://example.com",
    });
    expect(result.success).toBe(false);
  });
});

describe("core env schema", () => {
  const base = {
    CMS_SPACE_URL: "https://cms.example.com",
    CMS_ACCESS_TOKEN: "token",
    SANITY_API_VERSION: "v1",
    NEXTAUTH_SECRET,
    SESSION_SECRET,
    EMAIL_FROM: "from@example.com",
  } as const;

  it("defaults CART_COOKIE_SECRET outside production", async () => {
    process.env.NODE_ENV = "development";
    jest.resetModules();
    const { coreEnvSchema } = await import("@acme/config/env/core");
    const parsed = coreEnvSchema.parse({ ...base });
    expect(parsed.CART_COOKIE_SECRET).toBe("dev-cart-secret");
  });

  it("requires CART_COOKIE_SECRET in production", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.JEST_WORKER_ID;
    process.env.CART_COOKIE_SECRET = "secret";
    jest.resetModules();
    const { coreEnvSchema } = await import("@acme/config/env/core");
    const result = coreEnvSchema.safeParse({ ...base, NODE_ENV: "production" });
    expect(result.success).toBe(false);
  });

  it("validates boolean and number refinements", async () => {
    process.env.NODE_ENV = "development";
    jest.resetModules();
    const { coreEnvSchema } = await import("@acme/config/env/core");
    const ok = coreEnvSchema.safeParse({
      ...base,
      NODE_ENV: "production",
      CART_COOKIE_SECRET: "secret",
      DEPOSIT_RELEASE_ENABLED: "true",
      DEPOSIT_RELEASE_INTERVAL_MS: "1000",
    });
    expect(ok.success).toBe(true);
    const badBool = coreEnvSchema.safeParse({
      ...base,
      NODE_ENV: "production",
      CART_COOKIE_SECRET: "secret",
      DEPOSIT_RELEASE_ENABLED: "maybe",
    });
    expect(badBool.success).toBe(false);
    const badNum = coreEnvSchema.safeParse({
      ...base,
      NODE_ENV: "production",
      CART_COOKIE_SECRET: "secret",
      DEPOSIT_RELEASE_INTERVAL_MS: "notnum",
    });
    expect(badNum.success).toBe(false);
  });

  it("requireEnv enforces types", async () => {
    const { requireEnv } = await import("@acme/config/env/core");
    process.env.FLAG = "true";
    process.env.NUM = "5";
    expect(requireEnv("FLAG", "boolean")).toBe(true);
    expect(requireEnv("NUM", "number")).toBe(5);
    delete process.env.MISSING;
    expect(() => requireEnv("MISSING")).toThrow("MISSING is required");
  });
});

describe("email env schema", () => {
  it("requires provider-specific keys and coerces values", async () => {
    jest.resetModules();
    const { emailEnvSchema } = await import("@acme/config/env/email");
    const sendgrid = emailEnvSchema.safeParse({
      EMAIL_PROVIDER: "sendgrid",
      SENDGRID_API_KEY: "key",
      EMAIL_FROM: "from@example.com",
    });
    expect(sendgrid.success).toBe(true);
    const missing = emailEnvSchema.safeParse({
      EMAIL_PROVIDER: "sendgrid",
      EMAIL_FROM: "from@example.com",
    });
    expect(missing.success).toBe(false);
    const secure = emailEnvSchema.safeParse({
      SMTP_SECURE: "YeS",
      EMAIL_FROM: "from@example.com",
    });
    expect(secure.success).toBe(true);
    expect(secure.data?.SMTP_SECURE).toBe(true);
    const badSecure = emailEnvSchema.safeParse({
      SMTP_SECURE: "not",
      EMAIL_FROM: "from@example.com",
    });
    expect(badSecure.success).toBe(false);
  });
});

describe("payments env schema", () => {
  it("coerces sandbox boolean and defaults currency", async () => {
    jest.resetModules();
    const { paymentsEnvSchema } = await import("@acme/config/env/payments");
    const parsed = paymentsEnvSchema.parse({ PAYMENTS_SANDBOX: "false" });
    expect(parsed.PAYMENTS_SANDBOX).toBe(false);
    expect(parsed.PAYMENTS_CURRENCY).toBe("USD");
  });

  it("rejects invalid sandbox value and currency", async () => {
    jest.resetModules();
    const { paymentsEnvSchema } = await import("@acme/config/env/payments");
    expect(
      paymentsEnvSchema.safeParse({ PAYMENTS_SANDBOX: "maybe" }).success,
    ).toBe(false);
    expect(
      paymentsEnvSchema.safeParse({ PAYMENTS_CURRENCY: "usd" }).success,
    ).toBe(false);
  });

  it("requires stripe keys when PAYMENTS_PROVIDER=stripe", async () => {
    jest.resetModules();
    const { loadPaymentsEnv } = await import("@acme/config/env/payments");
    expect(() =>
      loadPaymentsEnv({ PAYMENTS_PROVIDER: "stripe" } as any),
    ).toThrow("Invalid payments environment variables");
  });
});

describe("shipping env schema", () => {
  it("requires provider keys and transforms inputs", async () => {
    jest.resetModules();
    const { shippingEnvSchema } = await import("@acme/config/env/shipping");
    const ok = shippingEnvSchema.safeParse({
      SHIPPING_PROVIDER: "ups",
      UPS_KEY: "ups",
      ALLOWED_COUNTRIES: "us,ca",
      LOCAL_PICKUP_ENABLED: "1",
      DEFAULT_COUNTRY: "us",
      FREE_SHIPPING_THRESHOLD: "25",
    });
    expect(ok.success).toBe(true);
    expect(ok.data.ALLOWED_COUNTRIES).toEqual(["US", "CA"]);
    expect(ok.data.LOCAL_PICKUP_ENABLED).toBe(true);
    expect(ok.data.DEFAULT_COUNTRY).toBe("US");
    expect(ok.data.FREE_SHIPPING_THRESHOLD).toBe(25);

    const missing = shippingEnvSchema.safeParse({ SHIPPING_PROVIDER: "ups" });
    expect(missing.success).toBe(false);
    const badBool = shippingEnvSchema.safeParse({
      LOCAL_PICKUP_ENABLED: "maybe",
    });
    expect(badBool.success).toBe(false);
    const badNum = shippingEnvSchema.safeParse({
      FREE_SHIPPING_THRESHOLD: "notnum",
    });
    expect(badNum.success).toBe(false);
    const badZone = shippingEnvSchema.safeParse({
      DEFAULT_SHIPPING_ZONE: "mars" as any,
    });
    expect(badZone.success).toBe(false);
  });

  it("requires keys for dhl via loader", async () => {
    jest.resetModules();
    const { loadShippingEnv } = await import("@acme/config/env/shipping");
    expect(() =>
      loadShippingEnv({ SHIPPING_PROVIDER: "dhl" } as any),
    ).toThrow("Invalid shipping environment variables");
  });
});
