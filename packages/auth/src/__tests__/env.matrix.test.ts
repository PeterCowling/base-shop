import { afterEach, describe, expect, it, jest } from "@jest/globals";

const RedisClientMock = jest.fn();
class RedisSessionStoreMock {}

jest.mock("@upstash/redis", () => ({ Redis: RedisClientMock }));
jest.mock("../redisStore", () => ({ RedisSessionStore: RedisSessionStoreMock }));

jest.mock("@acme/config/env/core", () => ({
  coreEnv: {
    get SESSION_STORE() {
      return process.env.SESSION_STORE;
    },
    get UPSTASH_REDIS_REST_URL() {
      return process.env.UPSTASH_REDIS_REST_URL;
    },
    get UPSTASH_REDIS_REST_TOKEN() {
      return process.env.UPSTASH_REDIS_REST_TOKEN;
    },
  },
}));

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV };
  RedisClientMock.mockReset();
});

const baseEnv = {
  NODE_ENV: "test",
  PAYMENTS_PROVIDER: "stripe",
  STRIPE_SECRET_KEY: "sk",
  STRIPE_WEBHOOK_SECRET: "wh",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk",
  EMAIL_PROVIDER: "resend",
  RESEND_API_KEY: "rk",
} as NodeJS.ProcessEnv;

const scenarios = [
  {
    name: "redis creds + preview on",
    env: {
      UPSTASH_REDIS_REST_URL: "https://redis",
      UPSTASH_REDIS_REST_TOKEN: "token",
      SANITY_PREVIEW_SECRET: "secret",
      PAYMENTS_SANDBOX: "true",
    },
    expectRedis: true,
    expectPreview: true,
    sandbox: true,
  },
  {
    name: "no redis creds + preview on",
    env: {
      SANITY_PREVIEW_SECRET: "secret",
      PAYMENTS_SANDBOX: "false",
    },
    expectRedis: false,
    expectPreview: true,
    sandbox: false,
  },
  {
    name: "redis creds + preview off",
    env: {
      UPSTASH_REDIS_REST_URL: "https://redis",
      UPSTASH_REDIS_REST_TOKEN: "token",
      PAYMENTS_SANDBOX: "0",
    },
    expectRedis: true,
    expectPreview: false,
    sandbox: false,
  },
  {
    name: "no redis creds + preview off",
    env: {
      PAYMENTS_SANDBOX: "1",
    },
    expectRedis: false,
    expectPreview: false,
    sandbox: true,
  },
] as const;

describe("env matrix", () => {
  it.each(scenarios)("%s", async ({ env, expectRedis, expectPreview, sandbox }) => {
    process.env = { ...baseEnv, ...env };
    if (!("SANITY_PREVIEW_SECRET" in env)) delete process.env.SANITY_PREVIEW_SECRET;
    if (!("UPSTASH_REDIS_REST_URL" in env)) delete process.env.UPSTASH_REDIS_REST_URL;
    if (!("UPSTASH_REDIS_REST_TOKEN" in env)) delete process.env.UPSTASH_REDIS_REST_TOKEN;
    jest.resetModules();

    const { paymentsEnv } = await import("@acme/config/env/payments");
    const { emailEnv } = await import("@acme/config/env/email");
    const { cmsEnv } = await import("@acme/config/env/cms");
    const { createSessionStore } = await import("../store");
    const { MemorySessionStore } = await import("../memoryStore");
    const { RedisSessionStore: RedisSessionStoreCtor } = await import("../redisStore");

    const store = await createSessionStore();
    if (expectRedis) {
      expect(store).toBeInstanceOf(RedisSessionStoreCtor);
    } else {
      expect(store).toBeInstanceOf(MemorySessionStore);
    }

    expect(paymentsEnv.PAYMENTS_PROVIDER).toBe("stripe");
    expect(paymentsEnv.PAYMENTS_SANDBOX).toBe(sandbox);
    expect(emailEnv.EMAIL_PROVIDER).toBe("resend");
    if (expectPreview) {
      expect(cmsEnv.SANITY_PREVIEW_SECRET).toBe("secret");
    } else {
      expect(cmsEnv.SANITY_PREVIEW_SECRET).toBe("dummy-preview-secret");
    }
  });
});

