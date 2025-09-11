import { describe, it, expect, afterEach } from "@jest/globals";
import { withEnv } from "../../../test/utils/withEnv";

const NEXT_SECRET = "nextauth-secret-32-chars-long-string!";
const SESSION_SECRET = "session-secret-32-chars-long-string!";
const REDIS_URL = "https://example.com";
const REDIS_TOKEN = "redis-token-32-chars-long-string!";
const DEV_NEXTAUTH_SECRET = "dev-nextauth-secret-32-chars-long-string!";
const DEV_SESSION_SECRET = "dev-session-secret-32-chars-long-string!";

type BoolKey = "ALLOW_GUEST" | "ENFORCE_2FA";

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

  it("accepts minimal valid environment", async () => {
    const { authEnvSchema } = await import("../auth");
    const result = authEnvSchema.safeParse(baseEnv);
    expect(result.success).toBe(true);
  });

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

describe("boolean coercions and defaults", () => {
  const baseVars = { NEXTAUTH_SECRET: NEXT_SECRET, SESSION_SECRET };

  it.each([
    [1, true],
    [0, false],
  ])("coerces ALLOW_GUEST=%s", async (input, expected) => {
    const { authEnv } = await withEnv(
      { ...baseVars, ALLOW_GUEST: input as any },
      () => import("../auth"),
    );
    expect(authEnv.ALLOW_GUEST).toBe(expected);
  });

  it.each([
    [1, true],
    [0, false],
  ])("coerces ENFORCE_2FA=%s", async (input, expected) => {
    const { authEnv } = await withEnv(
      { ...baseVars, ENFORCE_2FA: input as any },
      () => import("../auth"),
    );
    expect(authEnv.ENFORCE_2FA).toBe(expected);
  });

  it("defaults ALLOW_GUEST and ENFORCE_2FA to false", async () => {
    const { authEnv } = await withEnv(baseVars, () => import("../auth"));
    expect(authEnv.ALLOW_GUEST).toBe(false);
    expect(authEnv.ENFORCE_2FA).toBe(false);
  });
});

describe("AUTH_TOKEN_TTL normalization", () => {
  const baseVars = {
    NODE_ENV: "production",
    NEXTAUTH_SECRET: NEXT_SECRET,
    SESSION_SECRET,
  };

  it("removes blank AUTH_TOKEN_TTL", async () => {
    await withEnv(
      { ...baseVars, AUTH_TOKEN_TTL: "" },
      async () => {
        await import("../auth");
        expect(process.env.AUTH_TOKEN_TTL).toBeUndefined();
      },
    );
  });

  it("appends seconds to numeric AUTH_TOKEN_TTL", async () => {
    await withEnv(
      { ...baseVars, AUTH_TOKEN_TTL: "60" },
      async () => {
        await import("../auth");
        expect(process.env.AUTH_TOKEN_TTL).toBe("60s");
      },
    );
  });

  it.each([
    ["15m", "15m"],
    ["30 s", "30s"],
    ["45S", "45s"],
    [" 5 M ", "5m"],
  ])("normalizes unit string '%s' to '%s'", async (input, output) => {
    await withEnv(
      { ...baseVars, AUTH_TOKEN_TTL: input },
      async () => {
        await import("../auth");
        expect(process.env.AUTH_TOKEN_TTL).toBe(output);
      },
    );
  });
});

describe("authEnv expiry", () => {
  it("sets AUTH_TOKEN_EXPIRES_AT based on AUTH_TOKEN_TTL", async () => {
    const start = Date.now();
    const { authEnv } = await withEnv(
      {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET,
        AUTH_TOKEN_TTL: "1s",
      },
      () => import("../auth"),
    );
    const diff = authEnv.AUTH_TOKEN_EXPIRES_AT.getTime() - start;
    expect(diff).toBeGreaterThanOrEqual(1000);
    expect(diff).toBeLessThan(2000);
  });

  it("normalizes TTL before computing expiration", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2020-01-01T00:00:00Z"));
    const { authEnv } = await withEnv(
      {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET,
        AUTH_TOKEN_TTL: " 2 M ",
      },
      () => import("../auth"),
    );
    expect(authEnv.AUTH_TOKEN_TTL).toBe(120);
    expect(authEnv.AUTH_TOKEN_EXPIRES_AT.toISOString()).toBe(
      "2020-01-01T00:02:00.000Z",
    );
    jest.useRealTimers();
  });
});

describe("AUTH_TOKEN_TTL parsing", () => {
  const base = {
    NODE_ENV: "production",
    NEXTAUTH_SECRET: NEXT_SECRET,
    SESSION_SECRET,
  } as const;

  it.each([
    ["60", 60],
    ["2m", 120],
  ])("converts %s into %d seconds", async (input, expected) => {
    const { authEnv } = await withEnv(
      { ...base, AUTH_TOKEN_TTL: input },
      () => import("../auth"),
    );
    expect(authEnv.AUTH_TOKEN_TTL).toBe(expected);
  });

  it("rejects invalid TTL strings", async () => {
    await expect(
      withEnv(
        { ...base, AUTH_TOKEN_TTL: "1h" },
        () => import("../auth"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
  });
});

describe("development defaults", () => {
  it("applies dev secrets when NODE_ENV is not production", async () => {
    const { authEnv } = await withEnv(
      { NODE_ENV: "development", NEXTAUTH_SECRET: undefined, SESSION_SECRET: undefined },
      () => import("../auth"),
    );
    expect(authEnv.NEXTAUTH_SECRET).toBe(DEV_NEXTAUTH_SECRET);
    expect(authEnv.SESSION_SECRET).toBe(DEV_SESSION_SECRET);
  });
});

describe.each(["ALLOW_GUEST", "ENFORCE_2FA"] as const)(
  "%s boolean coercion",
  (key: BoolKey) => {
    it.each([
      ["true", true],
      ["false", false],
      ["1", true],
      ["0", false],
    ])("parses %s", async (input, expected) => {
      const { authEnv } = await withEnv(
        {
          NODE_ENV: "production",
          NEXTAUTH_SECRET: NEXT_SECRET,
          SESSION_SECRET,
          [key]: input,
        },
        () => import("../auth"),
      );
      expect((authEnv as Record<BoolKey, boolean>)[key]).toBe(expected);
    });
  },
);

describe("SESSION_STORE=redis", () => {
  const base = {
    NODE_ENV: "production",
    NEXTAUTH_SECRET: NEXT_SECRET,
    SESSION_SECRET,
  } as const;

  describe.each([
    ["missing UPSTASH_REDIS_REST_URL", { UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN }],
    ["missing UPSTASH_REDIS_REST_TOKEN", { UPSTASH_REDIS_REST_URL: REDIS_URL }],
  ])("throws when %s", (_, extra) => {
    it("throws", async () => {
      await expect(
        withEnv(
          { ...base, SESSION_STORE: "redis", ...extra },
          () => import("../auth"),
        ),
      ).rejects.toThrow("Invalid auth environment variables");
    });
  });

  it("loads when redis credentials are provided", async () => {
    const { authEnv } = await withEnv(
      {
        ...base,
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: REDIS_URL,
        UPSTASH_REDIS_REST_TOKEN: REDIS_TOKEN,
      },
      () => import("../auth"),
    );
    expect(selectStore(authEnv)).toBe("redis");
  });
});

describe("login rate limit redis credentials", () => {
  const base = {
    NODE_ENV: "production",
    NEXTAUTH_SECRET: NEXT_SECRET,
    SESSION_SECRET,
  } as const;

  describe.each([
    ["missing LOGIN_RATE_LIMIT_REDIS_URL", { LOGIN_RATE_LIMIT_REDIS_TOKEN: REDIS_TOKEN }],
    ["missing LOGIN_RATE_LIMIT_REDIS_TOKEN", { LOGIN_RATE_LIMIT_REDIS_URL: REDIS_URL }],
  ])("throws when %s", (_, extra) => {
    it("throws", async () => {
      await expect(
        withEnv({ ...base, ...extra }, () => import("../auth")),
      ).rejects.toThrow("Invalid auth environment variables");
    });
  });

  it("loads when rate limit redis credentials provided", async () => {
    const { authEnv } = await withEnv(
      {
        ...base,
        LOGIN_RATE_LIMIT_REDIS_URL: REDIS_URL,
        LOGIN_RATE_LIMIT_REDIS_TOKEN: REDIS_TOKEN,
      },
      () => import("../auth"),
    );
    expect(authEnv.LOGIN_RATE_LIMIT_REDIS_URL).toBe(REDIS_URL);
    expect(authEnv.LOGIN_RATE_LIMIT_REDIS_TOKEN).toBe(REDIS_TOKEN);
  });
});

describe("AUTH_PROVIDER credentials", () => {
  const base = {
    NODE_ENV: "production",
    NEXTAUTH_SECRET: NEXT_SECRET,
    SESSION_SECRET,
  } as const;

  describe.each([
    [
      "jwt",
      { AUTH_PROVIDER: "jwt" },
      { AUTH_PROVIDER: "jwt", JWT_SECRET: SESSION_SECRET },
    ],
    [
      "oauth",
      { AUTH_PROVIDER: "oauth" },
      {
        AUTH_PROVIDER: "oauth",
        OAUTH_CLIENT_ID: "client-id",
        OAUTH_CLIENT_SECRET: REDIS_TOKEN,
      },
    ],
  ] as const)("AUTH_PROVIDER=%s", (provider, badVars, goodVars) => {
    it("fails without credentials", async () => {
      await expect(
        withEnv({ ...base, ...badVars }, () => import("../auth")),
      ).rejects.toThrow("Invalid auth environment variables");
    });

    it("succeeds with credentials", async () => {
      const { authEnv } = await withEnv(
        { ...base, ...goodVars },
        () => import("../auth"),
      );
      expect(authEnv.AUTH_PROVIDER).toBe(provider);
    });
  });
});

describe("loadAuthEnv errors", () => {
  it("logs and throws on malformed env", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { loadAuthEnv } = await withEnv(
      {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET,
      },
      () => import("../auth"),
    );
    expect(() =>
      loadAuthEnv({ NODE_ENV: "production" } as any),
    ).toThrow("Invalid auth environment variables");
    expect(spy).toHaveBeenCalled();
  });
});

describe("strongSecret validation", () => {
  const base = {
    NODE_ENV: "production",
    SESSION_SECRET,
  } as const;

  it("rejects secrets shorter than 32 characters", async () => {
    await expect(
      withEnv(
        { ...base, NEXTAUTH_SECRET: "short" },
        () => import("../auth"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
  });

  it("rejects secrets with non-printable characters", async () => {
    await expect(
      withEnv(
        { ...base, NEXTAUTH_SECRET: `${"a".repeat(31)}\n` },
        () => import("../auth"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
  });

  it("rejects session secret shorter than 32 characters", async () => {
    await expect(
      withEnv(
        { ...base, NEXTAUTH_SECRET: NEXT_SECRET, SESSION_SECRET: "short" },
        () => import("../auth"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
  });

  it("rejects session secret with non-printable characters", async () => {
    await expect(
      withEnv(
        {
          ...base,
          NEXTAUTH_SECRET: NEXT_SECRET,
          SESSION_SECRET: `${"a".repeat(31)}\n`,
        },
        () => import("../auth"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
  });
});

