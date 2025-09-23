/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";

describe("constants helpers", () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it("resolveNodeEnv prefers raw over process.env and cached", async () => {
    await jest.isolateModulesAsync(async () => {
      const mod = await import("../../core/constants.ts");
      process.env = { ...ORIGINAL_ENV, NODE_ENV: "development" } as NodeJS.ProcessEnv;
      expect(mod.resolveNodeEnv({ NODE_ENV: "test" } as NodeJS.ProcessEnv)).toBe("test");
    });
  });

  it("shouldUseTestDefaults respects production and test modes and jest worker", async () => {
    await jest.isolateModulesAsync(async () => {
      const mod = await import("../../core/constants.ts");

      // production => false
      expect(mod.shouldUseTestDefaults({ NODE_ENV: "production" } as any)).toBe(false);

      // test => true
      expect(mod.shouldUseTestDefaults({ NODE_ENV: "test" } as any)).toBe(true);

      // development + has jest worker => true
      expect(mod.shouldUseTestDefaults({ NODE_ENV: "development", JEST_WORKER_ID: "1" } as any)).toBe(true);
    });
  });
});

