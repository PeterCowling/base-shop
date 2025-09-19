/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { loadCoreEnv } from "../../core.ts";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  jest.resetModules();
  jest.restoreAllMocks();
});

describe("core redis hints", () => {
  it("accepts full redis session store configuration", () => {
    const env = loadCoreEnv({
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_URL: "https://redis.example.com",
      UPSTASH_REDIS_REST_TOKEN: "strongtokenstrongtokenstrongtoken!!",
      EMAIL_FROM: "from@example.com",
      EMAIL_PROVIDER: "smtp",
    } as unknown as NodeJS.ProcessEnv);

    expect(env.SESSION_STORE).toBe("redis");
    expect(env.UPSTASH_REDIS_REST_URL).toBe("https://redis.example.com");
    expect(env.UPSTASH_REDIS_REST_TOKEN).toBe(
      "strongtokenstrongtokenstrongtoken!!",
    );
  });

  it("omits redis fields when session store is not configured", () => {
    const env = loadCoreEnv({} as NodeJS.ProcessEnv);
    expect(env.SESSION_STORE).toBeUndefined();
    expect(env.UPSTASH_REDIS_REST_URL).toBeUndefined();
    expect(env.UPSTASH_REDIS_REST_TOKEN).toBeUndefined();
  });
});

