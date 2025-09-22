/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { z } from "zod";

describe("env index module", () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    jest.dontMock("../cms.js");
    jest.dontMock("../auth.js");
    process.env = ORIGINAL_ENV;
  });

  it("throws and logs on invalid env", () => {
    jest.doMock("../cms.js", () => {
      const { z } = require("zod");
      return {
        cmsEnvSchema: z.object({
          CMS_SPACE_URL: z.string().url(),
          CMS_ACCESS_TOKEN: z.string().min(1),
          SANITY_API_VERSION: z.string().min(1),
        }),
      };
    });
    jest.doMock("../auth.js", () => {
      const { z } = require("zod");
      const strong = z.string().regex(/^[\x20-\x7E]{32,}$/);
      const base = z.object({
        NEXTAUTH_SECRET: strong,
        SESSION_SECRET: strong,
      });
      return {
        authEnvSchema: base.superRefine(() => {}),
        loadAuthEnv: () => ({
          NEXTAUTH_SECRET: "x".repeat(32),
          SESSION_SECRET: "x".repeat(32),
          AUTH_PROVIDER: "local",
          AUTH_TOKEN_TTL: 900,
          AUTH_TOKEN_EXPIRES_AT: new Date(),
        }),
      };
    });

    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "test",
      CMS_SPACE_URL: "nota-url",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "2023-10-01",
      CART_COOKIE_SECRET: "cart-secret",
      NEXTAUTH_SECRET: "",
      SESSION_SECRET: "",
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => require("../index.ts")).toThrow(
      "Invalid environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid environment variables:",
      expect.objectContaining({
        CMS_SPACE_URL: { _errors: expect.arrayContaining([expect.any(String)]) },
        NEXTAUTH_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
        SESSION_SECRET: { _errors: expect.arrayContaining([expect.any(String)]) },
      }),
    );
    errorSpy.mockRestore();
  });

  it("exports env with provided values on valid env", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "test",
      CMS_SPACE_URL: "https://cms.example.test",
      CMS_ACCESS_TOKEN: "test-token",
      SANITY_API_VERSION: "2023-10-01",
      CART_COOKIE_SECRET: "cart-secret",
      NEXTAUTH_SECRET: "x".repeat(32),
      SESSION_SECRET: "x".repeat(32),
    } as NodeJS.ProcessEnv;
    const modPromise = import("../index.ts");
    await expect(modPromise).resolves.toBeDefined();
    const { env } = await modPromise;
    expect(env).toEqual(
      expect.objectContaining({
        CMS_SPACE_URL: "https://cms.example.test",
        CMS_ACCESS_TOKEN: "test-token",
        SANITY_API_VERSION: "2023-10-01",
        CART_COOKIE_SECRET: "cart-secret",
      }),
    );
  });

  it("mergeEnvSchemas combines shapes", async () => {
    process.env = {
      ...process.env,
      NEXTAUTH_SECRET: "x".repeat(32),
      SESSION_SECRET: "x".repeat(32),
    } as NodeJS.ProcessEnv;
    const { mergeEnvSchemas } = await import("../index.ts");
    const schemaA = z.object({ FOO: z.string() });
    const schemaB = z.object({ BAR: z.number() });
    const merged = mergeEnvSchemas(schemaA, schemaB);
    expect(merged.shape).toHaveProperty("FOO");
    expect(merged.shape).toHaveProperty("BAR");
    expect(merged.safeParse({ FOO: "hello", BAR: 1 }).success).toBe(true);
    expect(merged.safeParse({ FOO: "hello" }).success).toBe(false);
  });

  it("mergeEnvSchemas allows partial optional objects", async () => {
    process.env = {
      ...process.env,
      NEXTAUTH_SECRET: "x".repeat(32),
      SESSION_SECRET: "x".repeat(32),
    } as NodeJS.ProcessEnv;
    const { mergeEnvSchemas } = await import("../index.ts");
    const schemaA = z.object({ A: z.string().optional() });
    const schemaB = z.object({ B: z.number().optional() });
    const merged = mergeEnvSchemas(schemaA, schemaB);
    expect(merged.safeParse({}).success).toBe(true);
    expect(merged.safeParse({ A: "x" }).success).toBe(true);
    expect(merged.safeParse({ B: 1 }).success).toBe(true);
  });

  it("later schemas override earlier ones", async () => {
    process.env = {
      ...process.env,
      NEXTAUTH_SECRET: "x".repeat(32),
      SESSION_SECRET: "x".repeat(32),
    } as NodeJS.ProcessEnv;
    const { mergeEnvSchemas } = await import("../index.ts");
    const schemaA = z.object({ FOO: z.string() });
    const schemaB = z.object({ FOO: z.number().optional() });
    const merged = mergeEnvSchemas(schemaA, schemaB);
    expect(merged.safeParse({ FOO: 1 }).success).toBe(true);
    expect(merged.safeParse({ FOO: "bar" }).success).toBe(false);
    expect((merged.shape.FOO as any)._def.typeName).toBe("ZodOptional");
  });

  it("performs shallow merges for nested objects", async () => {
    process.env = {
      ...process.env,
      NEXTAUTH_SECRET: "x".repeat(32),
      SESSION_SECRET: "x".repeat(32),
    } as NodeJS.ProcessEnv;
    const { mergeEnvSchemas } = await import("../index.ts");
    const schemaA = z.object({ nested: z.object({ a: z.string() }) });
    const schemaB = z.object({ nested: z.object({ b: z.number() }) });
    const merged = mergeEnvSchemas(schemaA, schemaB);
    const nested = merged.shape.nested as z.ZodObject<any>;
    expect(nested.shape).toHaveProperty("b");
    expect(nested.shape).not.toHaveProperty("a");
  });
});
