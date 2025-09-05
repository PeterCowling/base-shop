import { describe, it, expect, afterEach } from "@jest/globals";
import { withEnv } from "../../../config/test/utils/withEnv";

const NEXT_SECRET = "nextauth-secret-32-chars-long-string!";
const SESSION_SECRET = "session-secret-32-chars-long-string!";
const REDIS_URL = "https://example.com";
const REDIS_TOKEN = "redis-token-32-chars-long-string!";

function selectStore(env: any): string {
  return (
    env.SESSION_STORE ??
    (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
      ? "redis"
      : "memory")
  );
}

describe("auth env session configuration", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("throws when SESSION_SECRET is missing", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      withEnv(
        {
          NODE_ENV: "production",
          NEXTAUTH_SECRET: NEXT_SECRET,
          SESSION_SECRET: undefined,
        },
        () => import("@acme/config/env/auth"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
    expect(spy).toHaveBeenCalled();
  });

  it("selects redis when explicitly configured", async () => {
    const { authEnv } = await withEnv(
      {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET,
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: REDIS_URL,
        UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
      },
      () => import("@acme/config/env/auth"),
    );

    expect(selectStore(authEnv)).toBe("redis");
  });

  it("prefers memory when explicitly set", async () => {
    const { authEnv } = await withEnv(
      {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET,
        SESSION_STORE: "memory",
        UPSTASH_REDIS_REST_URL: REDIS_URL,
        UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
      },
      () => import("@acme/config/env/auth"),
    );

    expect(selectStore(authEnv)).toBe("memory");
  });

  it("falls back to redis when creds present without explicit store", async () => {
    const { authEnv } = await withEnv(
      {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET,
        UPSTASH_REDIS_REST_URL: REDIS_URL,
        UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
      },
      () => import("@acme/config/env/auth"),
    );

    expect(selectStore(authEnv)).toBe("redis");
  });

  it("falls back to memory when no store or creds provided", async () => {
    const { authEnv } = await withEnv(
      {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET,
      },
      () => import("@acme/config/env/auth"),
    );

    expect(selectStore(authEnv)).toBe("memory");
  });
});

