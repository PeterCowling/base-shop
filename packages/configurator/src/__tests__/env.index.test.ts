import { afterEach, describe, expect, it } from "@jest/globals";

const ORIGINAL_ENV = process.env;

const withEnv = async <T>(env: NodeJS.ProcessEnv, fn: () => Promise<T>): Promise<T> => {
  process.env = { ...ORIGINAL_ENV, ...env } as NodeJS.ProcessEnv;
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete (process.env as any)[key];
  }
  jest.resetModules();
  try {
    return await fn();
  } finally {
    process.env = ORIGINAL_ENV;
  }
};

describe("env/index", () => {
  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.resetModules();
  });

  it("merges sub-configs", async () => {
    await withEnv(
      {
        DEPOSIT_RELEASE_ENABLED: "true",
        AUTH_TOKEN_TTL: "60s",
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: "https://redis.example.com",
        UPSTASH_REDIS_REST_TOKEN: "strongtokenstrongtokenstrongtoken!!",
        PAYMENTS_PROVIDER: "stripe",
        STRIPE_SECRET_KEY: "sk_test_123",
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_123",
        STRIPE_WEBHOOK_SECRET: "whsec_123",
        ALLOWED_COUNTRIES: "US,CA",
      },
      async () => {
        const { env } = await import("@acme/config/env");
        expect(env).toMatchObject({
          DEPOSIT_RELEASE_ENABLED: true,
          AUTH_TOKEN_TTL: 60,
          SESSION_STORE: "redis",
          UPSTASH_REDIS_REST_URL: "https://redis.example.com",
          UPSTASH_REDIS_REST_TOKEN: "strongtokenstrongtokenstrongtoken!!",
          PAYMENTS_PROVIDER: "stripe",
          STRIPE_SECRET_KEY: "sk_test_123",
          NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_123",
          STRIPE_WEBHOOK_SECRET: "whsec_123",
          ALLOWED_COUNTRIES: ["US", "CA"],
        });
      },
    );
  });

  it("errors on invalid deposit-release flag", async () => {
    await withEnv(
      {
        DEPOSIT_RELEASE_ENABLED: "maybe",
      },
      async () => {
        const errorSpy = jest
          .spyOn(console, "error")
          .mockImplementation(() => {});
        await expect(import("@acme/config/env")).rejects.toThrow(
          "Invalid environment variables",
        );
        expect(errorSpy.mock.calls[0][1]).toHaveProperty(
          "DEPOSIT_RELEASE_ENABLED",
        );
        errorSpy.mockRestore();
      },
    );
  });

  it("requires redis token when SESSION_STORE=redis", async () => {
    await withEnv(
      {
        NODE_ENV: "development",
        AUTH_TOKEN_TTL: "10s",
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: "https://redis.example.com",
      },
      async () => {
        const errorSpy = jest
          .spyOn(console, "error")
          .mockImplementation(() => {});
        await expect(import("@acme/config/env")).rejects.toThrow(
          "Invalid auth environment variables",
        );
        expect(errorSpy.mock.calls[0][1]).toHaveProperty(
          "UPSTASH_REDIS_REST_TOKEN",
        );
        errorSpy.mockRestore();
      },
    );
  });
});

