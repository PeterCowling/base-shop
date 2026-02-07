/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { NEXT_SECRET, SESSION_SECRET } from "../authEnvTestUtils.ts";

const baseEnv = {
  CMS_SPACE_URL: "https://example.com",
  CMS_ACCESS_TOKEN: "token",
  SANITY_API_VERSION: "v1",
  EMAIL_FROM: "from@example.com",
};

const ORIGINAL_ENV = { ...process.env };

describe("loadCoreEnv number parsing", () => {
  const base = {
    ...baseEnv,
    CART_COOKIE_SECRET: "secret",
    NODE_ENV: "test",
    NEXTAUTH_SECRET: NEXT_SECRET,
    SESSION_SECRET: SESSION_SECRET,
  } as NodeJS.ProcessEnv;

  afterEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  describe("CART_TTL", () => {
    it.each([
      ["123", 123],
      ["1.5", 1.5],
      ["-2", -2],
      ["0", 0],
    ])("parses %s", async (input, expected) => {
      process.env = { ...base, CART_TTL: input };
      const { loadCoreEnv } = await import("../../core.ts");
      const env = loadCoreEnv();
      expect(env.CART_TTL).toBe(expected);
    });

    it("defaults when missing", async () => {
      process.env = { ...base };
      const { loadCoreEnv } = await import("../../core.ts");
      const env = loadCoreEnv();
      expect(env.CART_TTL).toBeUndefined();
    });

    it.each(["abc", "NaN"])("rejects %s", async (input) => {
      process.env = { ...base, CART_TTL: input };
      const { loadCoreEnv } = await import("../../core.ts");
      expect(() => loadCoreEnv()).toThrow("Invalid core environment variables");
    });
  });

  describe("DEPOSIT_RELEASE_INTERVAL_MS", () => {
    it.each([
      ["1000", 1000],
      ["1.5", 1.5],
      ["-5", -5],
      ["0", 0],
    ])("parses %s", async (input, expected) => {
      process.env = { ...base, DEPOSIT_RELEASE_INTERVAL_MS: input };
      const { loadCoreEnv } = await import("../../core.ts");
      const env = loadCoreEnv();
      expect(env.DEPOSIT_RELEASE_INTERVAL_MS).toBe(expected);
    });

    it("defaults when missing", async () => {
      process.env = { ...base };
      const { loadCoreEnv } = await import("../../core.ts");
      const env = loadCoreEnv();
      expect(env.DEPOSIT_RELEASE_INTERVAL_MS).toBeUndefined();
    });

    it.each(["abc", "NaN"])("rejects %s", async (input) => {
      process.env = { ...base, DEPOSIT_RELEASE_INTERVAL_MS: input };
      const { loadCoreEnv } = await import("../../core.ts");
      expect(() => loadCoreEnv()).toThrow("Invalid core environment variables");
    });
  });
});

