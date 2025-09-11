import { describe, it, expect } from "@jest/globals";
import { authEnvSchema } from "@acme/config/env/auth";
import { withEnv } from "./helpers/env";

const NEXT_SECRET = "nextauth-secret-32-chars-long-string!";
const SESSION_SECRET = "session-secret-32-chars-long-string!";
const REDIS_URL = "https://redis.example.com";
const REDIS_TOKEN = "redis-token-32-chars-long-string!";

const base = { NEXTAUTH_SECRET: NEXT_SECRET, SESSION_SECRET };

const selectStore = (env: any) =>
  env.SESSION_STORE ??
  (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? "redis"
    : "memory");

describe("store selection", () => {
  it("errors when redis creds incomplete", () => {
    expect(() =>
      authEnvSchema.parse({
        ...base,
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: REDIS_URL,
      }),
    ).toThrow("UPSTASH_REDIS_REST_TOKEN is required when SESSION_STORE=redis");

    expect(() =>
      authEnvSchema.parse({
        ...base,
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
      }),
    ).toThrow("UPSTASH_REDIS_REST_URL is required when SESSION_STORE=redis");
  });

  it("accepts redis when creds provided", () => {
    const env = authEnvSchema.parse({
      ...base,
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_URL: REDIS_URL,
      UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
    });
    expect(env.SESSION_STORE).toBe("redis");
  });

  it("prefers memory when explicitly set", () => {
    const env = authEnvSchema.parse({
      ...base,
      SESSION_STORE: "memory",
      UPSTASH_REDIS_REST_URL: REDIS_URL,
      UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
    });
    expect(env.SESSION_STORE).toBe("memory");
  });

  it("infers redis when creds present without store", () => {
    const env = authEnvSchema.parse({
      ...base,
      UPSTASH_REDIS_REST_URL: REDIS_URL,
      UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
    });
    expect(selectStore(env)).toBe("redis");
  });
});

describe("login rate-limit", () => {
  it("requires both url and token", () => {
    expect(() =>
      authEnvSchema.parse({
        ...base,
        LOGIN_RATE_LIMIT_REDIS_URL: REDIS_URL,
      }),
    ).toThrow(
      "LOGIN_RATE_LIMIT_REDIS_TOKEN is required when LOGIN_RATE_LIMIT_REDIS_URL is set",
    );

    expect(() =>
      authEnvSchema.parse({
        ...base,
        LOGIN_RATE_LIMIT_REDIS_TOKEN: REDIS_TOKEN,
      }),
    ).toThrow(
      "LOGIN_RATE_LIMIT_REDIS_URL is required when LOGIN_RATE_LIMIT_REDIS_TOKEN is set",
    );
  });

  it("passes when both provided", () => {
    const env = authEnvSchema.parse({
      ...base,
      LOGIN_RATE_LIMIT_REDIS_URL: REDIS_URL,
      LOGIN_RATE_LIMIT_REDIS_TOKEN: REDIS_TOKEN,
    });
    expect(env.LOGIN_RATE_LIMIT_REDIS_URL).toBe(REDIS_URL);
  });
});

describe("provider selection", () => {
  it("requires JWT_SECRET for jwt provider", () => {
    expect(() =>
      authEnvSchema.parse({ ...base, AUTH_PROVIDER: "jwt" }),
    ).toThrow("JWT_SECRET is required when AUTH_PROVIDER=jwt");

    const env = authEnvSchema.parse({
      ...base,
      AUTH_PROVIDER: "jwt",
      JWT_SECRET: NEXT_SECRET,
    });
    expect(env.AUTH_PROVIDER).toBe("jwt");
  });

  it("requires id and secret for oauth provider", () => {
    expect(() =>
      authEnvSchema.parse({ ...base, AUTH_PROVIDER: "oauth" }),
    ).toThrow("OAUTH_CLIENT_ID is required when AUTH_PROVIDER=oauth");

    expect(() =>
      authEnvSchema.parse({
        ...base,
        AUTH_PROVIDER: "oauth",
        OAUTH_CLIENT_ID: "id",
      }),
    ).toThrow("OAUTH_CLIENT_SECRET is required when AUTH_PROVIDER=oauth");

    const env = authEnvSchema.parse({
      ...base,
      AUTH_PROVIDER: "oauth",
      OAUTH_CLIENT_ID: "id",
      OAUTH_CLIENT_SECRET: NEXT_SECRET,
    });
    expect(env.AUTH_PROVIDER).toBe("oauth");
  });
});

describe("strongSecret validation", () => {
  it("rejects short secrets", () => {
    expect(() =>
      authEnvSchema.parse({
        ...base,
        NEXTAUTH_SECRET: "too-short",
      }),
    ).toThrow("must be at least 32 characters");
  });

  it("rejects non-ASCII secrets", () => {
    expect(() =>
      authEnvSchema.parse({
        ...base,
        NEXTAUTH_SECRET: "a".repeat(31) + "ö",
      }),
    ).toThrow("must contain only printable ASCII characters");
  });
});

describe("AUTH_TOKEN_TTL normalization", () => {
  it("handles numeric strings, suffixes, and blanks", async () => {
    await withEnv(
      { AUTH_TOKEN_TTL: "120", NODE_ENV: "development" },
      async () => {
        const mod = await import("@acme/config/env/auth");
        expect(process.env.AUTH_TOKEN_TTL).toBe("120s");
        expect(mod.authEnv.AUTH_TOKEN_TTL).toBe(120);
      },
    );

    await withEnv(
      { AUTH_TOKEN_TTL: "2m", NODE_ENV: "development" },
      async () => {
        const mod = await import("@acme/config/env/auth");
        expect(process.env.AUTH_TOKEN_TTL).toBe("2m");
        expect(mod.authEnv.AUTH_TOKEN_TTL).toBe(120);
      },
    );

    await withEnv(
      { AUTH_TOKEN_TTL: "", NODE_ENV: "development" },
      async () => {
        const mod = await import("@acme/config/env/auth");
        expect(process.env.AUTH_TOKEN_TTL).toBeUndefined();
        expect(mod.authEnv.AUTH_TOKEN_TTL).toBe(900);
      },
    );
  });
});
