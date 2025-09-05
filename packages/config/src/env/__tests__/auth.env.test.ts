import { describe, it, expect, afterEach } from "@jest/globals";
import { withEnv } from "../../../test/utils/withEnv";

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
        () => import("../auth"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
    expect(spy).toHaveBeenCalled();
  });

  it("loads when SESSION_SECRET is provided", async () => {
    const { authEnv } = await withEnv(
      {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET,
      },
      () => import("../auth"),
    );

    expect(authEnv.SESSION_SECRET).toBe(SESSION_SECRET);
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
      () => import("../auth"),
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
      () => import("../auth"),
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
      () => import("../auth"),
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
      () => import("../auth"),
    );

    expect(selectStore(authEnv)).toBe("memory");
  });
});

describe("authEnvSchema validation", () => {
  const baseEnv = { NEXTAUTH_SECRET: NEXT_SECRET, SESSION_SECRET };

  it("requires redis url when SESSION_STORE=redis", async () => {
    const { authEnvSchema } = await import("../auth");
    const result = authEnvSchema.safeParse({
      ...baseEnv,
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
    });
    expect(result.success).toBe(false);
    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["UPSTASH_REDIS_REST_URL"],
          message:
            "UPSTASH_REDIS_REST_URL is required when SESSION_STORE=redis",
        }),
      ]),
    );
  });

  it("requires redis token when SESSION_STORE=redis", async () => {
    const { authEnvSchema } = await import("../auth");
    const result = authEnvSchema.safeParse({
      ...baseEnv,
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_URL: REDIS_URL,
    });
    expect(result.success).toBe(false);
    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["UPSTASH_REDIS_REST_TOKEN"],
          message:
            "UPSTASH_REDIS_REST_TOKEN is required when SESSION_STORE=redis",
        }),
      ]),
    );
  });

  it("accepts redis store when credentials provided", async () => {
    const { authEnvSchema } = await import("../auth");
    const result = authEnvSchema.safeParse({
      ...baseEnv,
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_URL: REDIS_URL,
      UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
    });
    expect(result.success).toBe(true);
  });

  it("requires token when LOGIN_RATE_LIMIT_REDIS_URL is set", async () => {
    const { authEnvSchema } = await import("../auth");
    const result = authEnvSchema.safeParse({
      ...baseEnv,
      LOGIN_RATE_LIMIT_REDIS_URL: REDIS_URL,
    });
    expect(result.success).toBe(false);
    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["LOGIN_RATE_LIMIT_REDIS_TOKEN"],
          message:
            "LOGIN_RATE_LIMIT_REDIS_TOKEN is required when LOGIN_RATE_LIMIT_REDIS_URL is set",
        }),
      ]),
    );
  });

  it("requires url when LOGIN_RATE_LIMIT_REDIS_TOKEN is set", async () => {
    const { authEnvSchema } = await import("../auth");
    const result = authEnvSchema.safeParse({
      ...baseEnv,
      LOGIN_RATE_LIMIT_REDIS_TOKEN: REDIS_TOKEN,
    });
    expect(result.success).toBe(false);
    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["LOGIN_RATE_LIMIT_REDIS_URL"],
          message:
            "LOGIN_RATE_LIMIT_REDIS_URL is required when LOGIN_RATE_LIMIT_REDIS_TOKEN is set",
        }),
      ]),
    );
  });

  it("accepts login rate limit redis credentials when both provided", async () => {
    const { authEnvSchema } = await import("../auth");
    const result = authEnvSchema.safeParse({
      ...baseEnv,
      LOGIN_RATE_LIMIT_REDIS_URL: REDIS_URL,
      LOGIN_RATE_LIMIT_REDIS_TOKEN: REDIS_TOKEN,
    });
    expect(result.success).toBe(true);
  });

  it("requires JWT_SECRET when AUTH_PROVIDER=jwt", async () => {
    const { authEnvSchema } = await import("../auth");
    const result = authEnvSchema.safeParse({
      ...baseEnv,
      AUTH_PROVIDER: "jwt",
    });
    expect(result.success).toBe(false);
    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["JWT_SECRET"],
          message: "JWT_SECRET is required when AUTH_PROVIDER=jwt",
        }),
      ]),
    );
  });

  it("accepts JWT provider with secret", async () => {
    const { authEnvSchema } = await import("../auth");
    const result = authEnvSchema.safeParse({
      ...baseEnv,
      AUTH_PROVIDER: "jwt",
      JWT_SECRET: REDIS_TOKEN,
    });
    expect(result.success).toBe(true);
  });

  it("requires OAuth credentials when AUTH_PROVIDER=oauth", async () => {
    const { authEnvSchema } = await import("../auth");
    const result = authEnvSchema.safeParse({
      ...baseEnv,
      AUTH_PROVIDER: "oauth",
    });
    expect(result.success).toBe(false);
    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ["OAUTH_CLIENT_ID"],
          message: "OAUTH_CLIENT_ID is required when AUTH_PROVIDER=oauth",
        }),
        expect.objectContaining({
          path: ["OAUTH_CLIENT_SECRET"],
          message: "OAUTH_CLIENT_SECRET is required when AUTH_PROVIDER=oauth",
        }),
      ]),
    );
  });

  it("accepts OAuth provider with credentials", async () => {
    const { authEnvSchema } = await import("../auth");
    const result = authEnvSchema.safeParse({
      ...baseEnv,
      AUTH_PROVIDER: "oauth",
      OAUTH_CLIENT_ID: "client-id",
      OAUTH_CLIENT_SECRET: REDIS_TOKEN,
    });
    expect(result.success).toBe(true);
  });
});

describe("AUTH_TOKEN_TTL normalization", () => {
  it("normalizes plain numbers", async () => {
    const { authEnv } = await withEnv(
      {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET,
        AUTH_TOKEN_TTL: "60",
      },
      () => import("../auth"),
    );
    expect(authEnv.AUTH_TOKEN_TTL).toBe(60);
  });

  it("normalizes numbers with units", async () => {
    const { authEnv } = await withEnv(
      {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET,
        AUTH_TOKEN_TTL: "2m",
      },
      () => import("../auth"),
    );
    expect(authEnv.AUTH_TOKEN_TTL).toBe(120);
  });

  it("defaults when AUTH_TOKEN_TTL is blank", async () => {
    const { authEnv } = await withEnv(
      {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET,
        AUTH_TOKEN_TTL: "  ",
      },
      () => import("../auth"),
    );
    expect(authEnv.AUTH_TOKEN_TTL).toBe(900);
  });
});


