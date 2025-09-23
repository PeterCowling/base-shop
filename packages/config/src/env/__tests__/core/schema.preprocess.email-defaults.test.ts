/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";

describe("coreEnvPreprocessedSchema email defaults and trimming", () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it("trims EMAIL_PROVIDER and EMAIL_FROM and drops when blank", async () => {
    await jest.isolateModulesAsync(async () => {
      const { coreEnvPreprocessedSchema } = await import("../../core/schema.preprocess.ts");
      const parsed = coreEnvPreprocessedSchema.parse({
        EMAIL_PROVIDER: "  smtp  ",
        EMAIL_FROM: "  Sender@Example.COM  ",
      } as any);
      expect(parsed.EMAIL_PROVIDER).toBe("smtp");
      // Lowercased by email schema innerType merged in base schema
      expect(parsed.EMAIL_FROM).toBe("sender@example.com");

      const blank = coreEnvPreprocessedSchema.parse({
        EMAIL_PROVIDER: "   ",
        EMAIL_FROM: "   ",
      } as any);
      // Both dropped; provider re-derived below when missing
      expect(blank.EMAIL_PROVIDER).toBe("noop");
      expect(blank.EMAIL_FROM).toBeUndefined();
    });
  });

  it("derives EMAIL_PROVIDER=smtp when EMAIL_FROM exists and provider missing", async () => {
    await jest.isolateModulesAsync(async () => {
      const { coreEnvPreprocessedSchema } = await import("../../core/schema.preprocess.ts");
      const out = coreEnvPreprocessedSchema.parse({ EMAIL_FROM: "from@example.com" } as any);
      expect(out.EMAIL_PROVIDER).toBe("smtp");
    });
  });

  it("derives EMAIL_PROVIDER=noop when neither is provided", async () => {
    await jest.isolateModulesAsync(async () => {
      const { coreEnvPreprocessedSchema } = await import("../../core/schema.preprocess.ts");
      const out = coreEnvPreprocessedSchema.parse({} as any);
      expect(out.EMAIL_PROVIDER).toBe("noop");
    });
  });
});
