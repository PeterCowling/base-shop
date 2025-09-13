/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";

const baseEnv = {
  CMS_SPACE_URL: "https://example.com",
  CMS_ACCESS_TOKEN: "token",
  SANITY_API_VERSION: "v1",
};

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  jest.dontMock("../core.js");
  jest.resetModules();
});

const reload = async () => {
  jest.resetModules();
  return await import("../core.ts");
};

describe("core env loader", () => {
  describe("AUTH_TOKEN_TTL normalization", () => {
    it("handles number input", async () => {
      const { loadCoreEnv } = await reload();
      const env = loadCoreEnv({ ...baseEnv, AUTH_TOKEN_TTL: 123 } as any);
      expect(env.AUTH_TOKEN_TTL).toBe(900);
    });

    it("handles blank strings", async () => {
      const { loadCoreEnv } = await reload();
      const env = loadCoreEnv({ ...baseEnv, AUTH_TOKEN_TTL: "   " } as any);
      expect(env.AUTH_TOKEN_TTL).toBe(900);
    });

    it("handles numeric strings", async () => {
      const { loadCoreEnv } = await reload();
      const env = loadCoreEnv({ ...baseEnv, AUTH_TOKEN_TTL: "60" } as any);
      expect(env.AUTH_TOKEN_TTL).toBe(60);
    });

    it.each([
      ["5m", 300],
      ["5 m", 300],
    ])("handles %s forms", async (raw, expected) => {
      const { loadCoreEnv } = await reload();
      const env = loadCoreEnv({ ...baseEnv, AUTH_TOKEN_TTL: raw } as any);
      expect(env.AUTH_TOKEN_TTL).toBe(expected);
    });
  });

  describe("error aggregation", () => {
    it("collects auth and email issues", async () => {
      const { coreEnvSchema } = await reload();
      const parsed = coreEnvSchema.safeParse({
        ...baseEnv,
        AUTH_PROVIDER: "jwt",
        EMAIL_PROVIDER: "sendgrid",
      } as Record<string, unknown>);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: ["JWT_SECRET"] }),
            expect.objectContaining({ path: ["SENDGRID_API_KEY"] }),
          ]),
        );
      }
    });
  });

  describe("proxy delegates to getCoreEnv", () => {
    const setup = async () => {
      const loadCoreEnv = jest.fn(() => baseEnv as any);
      jest.doMock("../core.js", () => ({ loadCoreEnv }));
      process.env.NODE_ENV = "production";
      const mod = await import("../core.ts");
      return { coreEnv: mod.coreEnv, loadCoreEnv };
    };

    it("delegates get", async () => {
      const { coreEnv, loadCoreEnv } = await setup();
      coreEnv.CMS_SPACE_URL;
      expect(loadCoreEnv).toHaveBeenCalledTimes(1);
    });

    it("delegates has", async () => {
      const { coreEnv, loadCoreEnv } = await setup();
      void ("CMS_SPACE_URL" in coreEnv);
      expect(loadCoreEnv).toHaveBeenCalledTimes(1);
    });

    it("delegates ownKeys", async () => {
      const { coreEnv, loadCoreEnv } = await setup();
      Reflect.ownKeys(coreEnv);
      expect(loadCoreEnv).toHaveBeenCalledTimes(1);
    });

    it("delegates getOwnPropertyDescriptor", async () => {
      const { coreEnv, loadCoreEnv } = await setup();
      Object.getOwnPropertyDescriptor(coreEnv, "CMS_SPACE_URL");
      expect(loadCoreEnv).toHaveBeenCalledTimes(1);
    });
  });

  describe("fail-fast production parsing", () => {
    const NEXT_SECRET = "nextauth-secret-32-chars-long-string!";
    const SESSION_SECRET = "session-secret-32-chars-long-string!";

    it("parses at import time in production", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        NODE_ENV: "production",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET: SESSION_SECRET,
        CART_COOKIE_SECRET: "cart-secret",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "v1",
      } as NodeJS.ProcessEnv;
      delete (process.env as any).CMS_SPACE_URL;
      delete (process.env as any).JEST_WORKER_ID;
      jest.resetModules();
      await expect(import("../core.ts")).rejects.toThrow(
        "Invalid core environment variables",
      );
    });
  });

  describe("requireEnv error handling", () => {
    it("throws for invalid boolean", async () => {
      process.env.FLAG = "maybe";
      const { requireEnv } = await reload();
      expect(() => requireEnv("FLAG", "boolean")).toThrow(
        "FLAG must be a boolean",
      );
    });

    it("throws for invalid number", async () => {
      process.env.NUM = "abc";
      const { requireEnv } = await reload();
      expect(() => requireEnv("NUM", "number")).toThrow(
        "NUM must be a number",
      );
    });
  });

  describe("coreEnvSchema AUTH_TOKEN_TTL normalization", () => {
    it("defaults numeric values", async () => {
      const { coreEnvSchema } = await reload();
      const result = coreEnvSchema.safeParse({
        ...baseEnv,
        AUTH_TOKEN_TTL: 123,
      } as Record<string, unknown>);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.AUTH_TOKEN_TTL).toBe(900);
      }
    });

    it("defaults blank strings", async () => {
      const { coreEnvSchema } = await reload();
      const result = coreEnvSchema.safeParse({
        ...baseEnv,
        AUTH_TOKEN_TTL: "   ",
      } as Record<string, unknown>);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.AUTH_TOKEN_TTL).toBe(900);
      }
    });

    it("parses unit-suffixed strings", async () => {
      const { coreEnvSchema } = await reload();
      const result = coreEnvSchema.safeParse({
        ...baseEnv,
        AUTH_TOKEN_TTL: "5m",
      } as Record<string, unknown>);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.AUTH_TOKEN_TTL).toBe(300);
      }
    });
  });
});
