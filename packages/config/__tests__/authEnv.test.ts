import { expect } from "@jest/globals";
import { withEnv } from "../test/utils/withEnv";

describe("authEnv", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("uses development defaults for secrets", async () => {
    const { authEnv } = await withEnv(
      {
        NODE_ENV: "development",
      },
      () => import("../src/env/auth"),
    );

    expect(authEnv.NEXTAUTH_SECRET).toBe("dev-nextauth-secret");
    expect(authEnv.SESSION_SECRET).toBe("dev-session-secret");
  });

  it("throws and logs when NEXTAUTH_SECRET is missing in production", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      withEnv(
        {
          NODE_ENV: "production",
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
          NEXTAUTH_SECRET: "x",
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
            NEXTAUTH_SECRET: "nextauth",
            SESSION_SECRET: "session",
            SESSION_STORE: "redis",
            UPSTASH_REDIS_REST_TOKEN: "token",
          },
          () => import("../src/env/auth"),
        ),
      ).rejects.toThrow("Invalid auth environment variables");
      expect(spy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          UPSTASH_REDIS_REST_URL: { _errors: [expect.any(String)] },
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
            NEXTAUTH_SECRET: "nextauth",
            SESSION_SECRET: "session",
            SESSION_STORE: "redis",
            UPSTASH_REDIS_REST_URL: "https://example.com",
          },
          () => import("../src/env/auth"),
        ),
      ).rejects.toThrow("Invalid auth environment variables");
      expect(spy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          UPSTASH_REDIS_REST_TOKEN: { _errors: [expect.any(String)] },
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
          NEXTAUTH_SECRET: "nextauth",
          SESSION_SECRET: "session",
          LOGIN_RATE_LIMIT_REDIS_URL: "https://example.com",
        },
        () => import("../src/env/auth"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
    expect(spy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        LOGIN_RATE_LIMIT_REDIS_TOKEN: { _errors: [expect.any(String)] },
      }),
    );
  });

  it("throws and logs when only LOGIN_RATE_LIMIT_REDIS_TOKEN is set", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      withEnv(
        {
          NODE_ENV: "production",
          NEXTAUTH_SECRET: "nextauth",
          SESSION_SECRET: "session",
          LOGIN_RATE_LIMIT_REDIS_TOKEN: "token",
        },
        () => import("../src/env/auth"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
    expect(spy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        LOGIN_RATE_LIMIT_REDIS_URL: { _errors: [expect.any(String)] },
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
          NEXTAUTH_SECRET: "nextauth",
          SESSION_SECRET: "session",
          SESSION_STORE: "redis",
          UPSTASH_REDIS_REST_URL: "https://example.com",
          UPSTASH_REDIS_REST_TOKEN: "token",
          LOGIN_RATE_LIMIT_REDIS_URL: "https://example.com",
          LOGIN_RATE_LIMIT_REDIS_TOKEN: "token",
        },
        () => import("../src/env/auth"),
      );

      expect(authEnv).toMatchObject({
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: "https://example.com",
        UPSTASH_REDIS_REST_TOKEN: "token",
        LOGIN_RATE_LIMIT_REDIS_URL: "https://example.com",
        LOGIN_RATE_LIMIT_REDIS_TOKEN: "token",
      });
      expect(spy).not.toHaveBeenCalled();
    },
  );
});

