import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { z } from "zod";

describe("env index module", () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
  });

  it("throws and logs on invalid env", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "test",
      CART_COOKIE_SECRET: "",
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(import("../index.ts")).rejects.toThrow(
      "Invalid environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid environment variables:",
      expect.objectContaining({
        CART_COOKIE_SECRET: { _errors: [expect.any(String)] },
      }),
    );
    errorSpy.mockRestore();
  });

  it("mergeEnvSchemas combines shapes", async () => {
    const { mergeEnvSchemas } = await import("../index.ts");
    const schemaA = z.object({ FOO: z.string() });
    const schemaB = z.object({ BAR: z.number() });
    const merged = mergeEnvSchemas(schemaA, schemaB);
    expect(merged.shape).toHaveProperty("FOO");
    expect(merged.shape).toHaveProperty("BAR");
    expect(merged.safeParse({ FOO: "hello", BAR: 1 }).success).toBe(true);
    expect(merged.safeParse({ FOO: "hello" }).success).toBe(false);
  });
});

