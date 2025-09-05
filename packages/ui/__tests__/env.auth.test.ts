/** @jest-environment node */
import { describe, it, expect, jest } from "@jest/globals";
import { withEnv } from "../../config/test/utils/withEnv";

const REDIS_URL = "https://example.com";
const STRONG_SECRET = "redis-token-32-chars-long-string!";

describe("auth env validation", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("requires strong JWT secrets", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        { NODE_ENV: "development", AUTH_PROVIDER: "jwt", JWT_SECRET: "weak" },
        () => import("@acme/config/src/env/auth.ts"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
    const formatted = spy.mock.calls[0][1];
    expect(formatted.JWT_SECRET?._errors[0]).toContain(
      "must be at least 32 characters",
    );
  });

  it("requires upstash credentials for redis session store", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        {
          NODE_ENV: "development",
          SESSION_STORE: "redis",
          UPSTASH_REDIS_REST_URL: REDIS_URL,
        },
        () => import("@acme/config/src/env/auth.ts"),
      ),
    ).rejects.toThrow("Invalid auth environment variables");
    const formatted = spy.mock.calls[0][1];
    expect(formatted.UPSTASH_REDIS_REST_TOKEN?._errors[0]).toContain(
      "UPSTASH_REDIS_REST_TOKEN is required",
    );
  });

  it("loads when redis credentials provided", async () => {
    const { authEnv } = await withEnv(
      {
        NODE_ENV: "development",
        SESSION_STORE: "redis",
        UPSTASH_REDIS_REST_URL: REDIS_URL,
        UPSTASH_REDIS_REST_TOKEN: STRONG_SECRET,
      },
      () => import("@acme/config/src/env/auth.ts"),
    );
    expect(authEnv.SESSION_STORE).toBe("redis");
  });
});
