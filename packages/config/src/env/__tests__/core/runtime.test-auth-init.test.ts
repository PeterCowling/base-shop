/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";

describe("runtime.test-auth-init side effects", () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    delete (globalThis as any).__ACME_ALLOW_NUMERIC_TTL__;
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it("invokes loadAuthEnv when redis-related flags are present and forwards allowNumericTtl", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "test",
      // Presence of either of these should trigger the loader; include both for validity
      LOGIN_RATE_LIMIT_REDIS_URL: "https://redis.example.test",
      LOGIN_RATE_LIMIT_REDIS_TOKEN: "x".repeat(32),
      // Provide numeric TTL to verify allowNumericTtl propagation
      AUTH_TOKEN_TTL: 900 as any,
    } as NodeJS.ProcessEnv;

    (globalThis as any).__ACME_ALLOW_NUMERIC_TTL__ = true;

    const loadSpy = jest.fn(() => ({}));

    jest.doMock("@acme/config/env/auth", () => ({
      loadAuthEnv: loadSpy,
    }));

    await jest.isolateModulesAsync(async () => {
      await import("../../core/runtime.test-auth-init.ts");
    });

    expect(loadSpy).toHaveBeenCalledTimes(1);
    const [, opts] = loadSpy.mock.calls[0];
    expect(opts).toEqual({ allowNumericTtl: true });
  });

  it("does not invoke loadAuthEnv when no redis flags are present", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "test",
      SESSION_STORE: undefined as any,
      UPSTASH_REDIS_REST_URL: undefined as any,
      UPSTASH_REDIS_REST_TOKEN: undefined as any,
      LOGIN_RATE_LIMIT_REDIS_URL: undefined as any,
      LOGIN_RATE_LIMIT_REDIS_TOKEN: undefined as any,
    } as NodeJS.ProcessEnv;

    const loadSpy = jest.fn(() => ({}));
    jest.doMock("@acme/config/env/auth", () => ({
      loadAuthEnv: loadSpy,
    }));

    await jest.isolateModulesAsync(async () => {
      await import("../../core/runtime.test-auth-init.ts");
    });

    expect(loadSpy).not.toHaveBeenCalled();
  });
});
