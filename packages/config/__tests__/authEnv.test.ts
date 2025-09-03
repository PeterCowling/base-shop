import { expect } from "@jest/globals";

describe("authEnv", () => {
  const OLD_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  it("uses development defaults for secrets", async () => {
    process.env = {
      NODE_ENV: "development",
    } as NodeJS.ProcessEnv;

    const { authEnv } = await import("../src/env/auth");

    expect(authEnv.NEXTAUTH_SECRET).toBe("dev-nextauth-secret");
    expect(authEnv.SESSION_SECRET).toBe("dev-session-secret");
  });

  it("throws and logs when NEXTAUTH_SECRET is missing in production", async () => {
    process.env = {
      NODE_ENV: "production",
    } as NodeJS.ProcessEnv;

    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(import("../src/env/auth")).rejects.toThrow(
      "Invalid auth environment variables",
    );
    expect(spy).toHaveBeenCalled();
  });

  it("throws and logs when SESSION_SECRET is missing in production", async () => {
    process.env = {
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "x",
    } as NodeJS.ProcessEnv;

    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(import("../src/env/auth")).rejects.toThrow(
      "Invalid auth environment variables",
    );
    expect(spy).toHaveBeenCalled();
  });

  it(
    "throws and logs when SESSION_STORE is redis without UPSTASH_REDIS_REST_URL",
    async () => {
      process.env = {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: "nextauth",
        SESSION_SECRET: "session",
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_TOKEN: "token",
      } as NodeJS.ProcessEnv;

      const spy = jest.spyOn(console, "error").mockImplementation(() => {});

      await expect(import("../src/env/auth")).rejects.toThrow(
        "Invalid auth environment variables",
      );
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
      process.env = {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: "nextauth",
        SESSION_SECRET: "session",
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: "https://example.com",
      } as NodeJS.ProcessEnv;

      const spy = jest.spyOn(console, "error").mockImplementation(() => {});

      await expect(import("../src/env/auth")).rejects.toThrow(
        "Invalid auth environment variables",
      );
      expect(spy).toHaveBeenCalledWith(
        "❌ Invalid auth environment variables:",
        expect.objectContaining({
          UPSTASH_REDIS_REST_TOKEN: { _errors: [expect.any(String)] },
        }),
      );
    },
  );

  it("throws and logs when only LOGIN_RATE_LIMIT_REDIS_URL is set", async () => {
    process.env = {
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "nextauth",
      SESSION_SECRET: "session",
      LOGIN_RATE_LIMIT_REDIS_URL: "https://example.com",
    } as NodeJS.ProcessEnv;

    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(import("../src/env/auth")).rejects.toThrow(
      "Invalid auth environment variables",
    );
    expect(spy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        LOGIN_RATE_LIMIT_REDIS_TOKEN: { _errors: [expect.any(String)] },
      }),
    );
  });

  it("throws and logs when only LOGIN_RATE_LIMIT_REDIS_TOKEN is set", async () => {
    process.env = {
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "nextauth",
      SESSION_SECRET: "session",
      LOGIN_RATE_LIMIT_REDIS_TOKEN: "token",
    } as NodeJS.ProcessEnv;

    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(import("../src/env/auth")).rejects.toThrow(
      "Invalid auth environment variables",
    );
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
      process.env = {
        NODE_ENV: "production",
        NEXTAUTH_SECRET: "nextauth",
        SESSION_SECRET: "session",
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: "https://example.com",
        UPSTASH_REDIS_REST_TOKEN: "token",
        LOGIN_RATE_LIMIT_REDIS_URL: "https://example.com",
        LOGIN_RATE_LIMIT_REDIS_TOKEN: "token",
      } as NodeJS.ProcessEnv;

      const spy = jest.spyOn(console, "error").mockImplementation(() => {});

      const { authEnv } = await import("../src/env/auth");

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
