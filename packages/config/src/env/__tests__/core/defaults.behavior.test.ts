/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { loadCoreEnv } from "../../core.ts";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  jest.resetModules();
  jest.restoreAllMocks();
});

describe("core defaults and explicit parsing", () => {
  it("provides sensible defaults for a minimal env", () => {
    const env = loadCoreEnv({} as NodeJS.ProcessEnv);
    expect(env.CMS_SPACE_URL).toBe("https://cms.example.com");
    expect(env.CMS_ACCESS_TOKEN).toBe("placeholder-token");
    expect(env.SANITY_API_VERSION).toBe("2021-10-21");
    expect(env.CART_COOKIE_SECRET).toBe("dev-cart-secret");
  });

  it("parses explicit values including booleans, numbers and URLs", () => {
    const env = loadCoreEnv({
      CMS_SPACE_URL: "https://example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "v1",
      CART_COOKIE_SECRET: "secret",
      CART_TTL: "45",
      NEXT_PUBLIC_BASE_URL: "https://shop.example.com",
      OUTPUT_EXPORT: "1",
      SESSION_STORE: "redis",
      UPSTASH_REDIS_REST_URL: "https://redis.example.com",
      UPSTASH_REDIS_REST_TOKEN: "strongtokenstrongtokenstrongtoken!!",
      COOKIE_DOMAIN: "example.com",
      EMAIL_FROM: "from@example.com",
      EMAIL_PROVIDER: "smtp",
    } as unknown as NodeJS.ProcessEnv);

    expect(env.CART_TTL).toBe(45);
    expect(env.OUTPUT_EXPORT).toBe(true);
    expect(env.NEXT_PUBLIC_BASE_URL).toBe("https://shop.example.com");
    expect(env.SESSION_STORE).toBe("redis");
    expect(env.UPSTASH_REDIS_REST_URL).toBe("https://redis.example.com");
    expect(env.UPSTASH_REDIS_REST_TOKEN).toBe(
      "strongtokenstrongtokenstrongtoken!!",
    );
    expect(env.COOKIE_DOMAIN).toBe("example.com");
  });
});

