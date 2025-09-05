import { expect } from "@jest/globals";
import { withEnv } from "../test/utils/withEnv";

const NEXT_SECRET = "nextauth-secret-32-chars-long-string!";
const SESSION_SECRET = "session-secret-32-chars-long-string!";
const DEV_NEXT_SECRET = "dev-nextauth-secret-32-chars-long-string!";
const DEV_SESSION_SECRET = "dev-session-secret-32-chars-long-string!";
const STRONG_TOKEN = "token-value-32-chars-long-string!!";

describe("authEnv", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("uses development defaults for secrets", async () => {
    const { authEnv } = await withEnv(
      {
        NODE_ENV: "development",
        NEXTAUTH_SECRET: undefined,
        SESSION_SECRET: undefined,
      },
      () => import("../src/env/auth"),
    );

    expect(authEnv.NEXTAUTH_SECRET).toBe(DEV_NEXT_SECRET);
    expect(authEnv.SESSION_SECRET).toBe(DEV_SESSION_SECRET);
  });

  it("throws and logs when NEXTAUTH_SECRET is missing in production", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      withEnv(
        {
          NODE_ENV: "production",
          NEXTAUTH_SECRET: undefined,
          SESSION_SECRET: SESSION_SECRET,
        },
        () => import("../src/env/auth"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
    expect(spy).toHaveBeenCalled();
  });

  it("throws and logs when SESSION_SECRET is missing in production", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      withEnv(
        {
          NODE_ENV: "production",
          NEXTAUTH_SECRET: NEXT_SECRET,
          SESSION_SECRET: undefined,
        },
        () => import("../src/env/auth"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
    expect(spy).toHaveBeenCalled();
  });

  it(
    "throws and logs when SESSION_STORE is redis without UPSTASH_REDIS_REST_URL",
    async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});

      await expect(
        withEnv(
          {
            NODE_ENV: "production",
            NEXTAUTH_SECRET: NEXT_SECRET,
            SESSION_SECRET: SESSION_SECRET,
            SESSION_STORE: "redis",
            UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN,
          },
          () => import("../src/env/auth"),
        ),
      ).rejects.toThrow("Invalid auth environment variables");
      expect(spy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          UPSTASH_REDIS_REST_URL: { _errors: expect.arrayContaining([expect.any(String)]) },
        }),
      );
    },
  );

  it(
    "throws and logs when SESSION_STORE is redis without UPSTASH_REDIS_REST_TOKEN",
    async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});

      await expect(
        withEnv(
          {
            NODE_ENV: "production",
            NEXTAUTH_SECRET: NEXT_SECRET,
            SESSION_SECRET: SESSION_SECRET,
            SESSION_STORE: "redis",
            UPSTASH_REDIS_REST_URL: "https://example.com",
          },
          () => import("../src/env/auth"),
        ),
      ).rejects.toThrow("Invalid auth environment variables");
      expect(spy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          UPSTASH_REDIS_REST_TOKEN: { _errors: expect.arrayContaining([expect.any(String)]) },
        }),
      );
    },
  );

  it("throws and logs when only LOGIN_RATE_LIMIT_REDIS_URL is set", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      withEnv(
        {
          NODE_ENV: "production",
          NEXTAUTH_SECRET: NEXT_SECRET,
          SESSION_SECRET: SESSION_SECRET,
          LOGIN_RATE_LIMIT_REDIS_URL: "https://example.com",
        },
        () => import("../src/env/auth"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
    expect(spy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        LOGIN_RATE_LIMIT_REDIS_TOKEN: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
  });

  it("throws and logs when only LOGIN_RATE_LIMIT_REDIS_TOKEN is set", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      withEnv(
        {
          NODE_ENV: "production",
          NEXTAUTH_SECRET: NEXT_SECRET,
          SESSION_SECRET: SESSION_SECRET,
          LOGIN_RATE_LIMIT_REDIS_TOKEN: STRONG_TOKEN,
        },
        () => import("../src/env/auth"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
    expect(spy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        LOGIN_RATE_LIMIT_REDIS_URL: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
  });

  it(
    "parses redis configuration when session store and rate limit fields are provided",
    async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});

      const { authEnv } = await withEnv(
        {
          NODE_ENV: "production",
          NEXTAUTH_SECRET: NEXT_SECRET,
          SESSION_SECRET: SESSION_SECRET,
          SESSION_STORE: "redis",
          UPSTASH_REDIS_REST_URL: "https://example.com",
          UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN,
          LOGIN_RATE_LIMIT_REDIS_URL: "https://example.com",
          LOGIN_RATE_LIMIT_REDIS_TOKEN: STRONG_TOKEN,
        },
        () => import("../src/env/auth"),
      );

      expect(authEnv).toMatchObject({
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: "https://example.com",
        UPSTASH_REDIS_REST_TOKEN: STRONG_TOKEN,
        LOGIN_RATE_LIMIT_REDIS_URL: "https://example.com",
        LOGIN_RATE_LIMIT_REDIS_TOKEN: STRONG_TOKEN,
      });
      expect(spy).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["60s", 60],
    ["2m", 120],
  ])("parses TTL %s into %d seconds", async (input, expected) => {
    const { authEnv } = await withEnv(
      { NODE_ENV: "test", AUTH_TOKEN_TTL: input },
      () => import("../src/env/auth"),
    );
    expect(authEnv.AUTH_TOKEN_TTL).toBe(expected);
  });

  describe("AUTH_TOKEN_TTL normalization", () => {
    const baseVars = {
      NODE_ENV: "development",
      NEXTAUTH_SECRET: NEXT_SECRET,
      SESSION_SECRET,
    };

    it("removes blank AUTH_TOKEN_TTL", async () => {
      const { snapshot } = await withEnv(
        { ...baseVars, AUTH_TOKEN_TTL: "" },
        async () => {
          await import("../src/env/auth");
          return { snapshot: { ...process.env } };
        },
      );
      expect(snapshot.AUTH_TOKEN_TTL).toBeUndefined();
    });

    it("appends seconds to numeric AUTH_TOKEN_TTL", async () => {
      const { snapshot } = await withEnv(
        { ...baseVars, AUTH_TOKEN_TTL: "60" },
        async () => {
          await import("../src/env/auth");
          return { snapshot: { ...process.env } };
        },
      );
      expect(snapshot.AUTH_TOKEN_TTL).toBe("60s");
    });
  });

  describe("strongSecret schema", () => {
    it("rejects secrets shorter than 32 characters", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(
        withEnv(
          {
            NODE_ENV: "production",
            NEXTAUTH_SECRET: NEXT_SECRET,
            SESSION_SECRET,
            AUTH_PROVIDER: "jwt",
            JWT_SECRET: "short",
          },
          () => import("../src/env/auth"),
        ),
      ).rejects.toThrow("Invalid auth environment variables");
      expect(spy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          JWT_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
        }),
      );
    });

    it("rejects secrets with non-printable ASCII characters", async () => {
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(
        withEnv(
          {
            NODE_ENV: "production",
            NEXTAUTH_SECRET: NEXT_SECRET,
            SESSION_SECRET,
            AUTH_PROVIDER: "jwt",
            JWT_SECRET: `${"a".repeat(31)}\n`,
          },
          () => import("../src/env/auth"),
        ),
      ).rejects.toThrow("Invalid auth environment variables");
      expect(spy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          JWT_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
        }),
      );
    });
  });

  it("requires JWT_SECRET when AUTH_PROVIDER=jwt", async () => {
    await expect(
      withEnv(
        {
          NODE_ENV: "production",
          NEXTAUTH_SECRET: NEXT_SECRET,
          SESSION_SECRET,
          AUTH_PROVIDER: "jwt",
        },
        () => import("../src/env/auth"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
  });

  it("requires OAuth credentials when AUTH_PROVIDER=oauth", async () => {
    await expect(
      withEnv(
        {
          NODE_ENV: "production",
          NEXTAUTH_SECRET: NEXT_SECRET,
          SESSION_SECRET,
          AUTH_PROVIDER: "oauth",
        },
        () => import("../src/env/auth"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
  });

  it("applies defaults and computes token expiry", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2020-01-01T00:00:00Z"));
    const { authEnv } = await withEnv(
      {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET,
      },
      () => import("../src/env/auth"),
    );
    expect(authEnv.AUTH_TOKEN_TTL).toBe(900);
    expect(authEnv.TOKEN_ALGORITHM).toBe("HS256");
    expect(authEnv.AUTH_TOKEN_EXPIRES_AT.toISOString()).toBe(
      "2020-01-01T00:15:00.000Z",
    );
    jest.useRealTimers();
  });
});

