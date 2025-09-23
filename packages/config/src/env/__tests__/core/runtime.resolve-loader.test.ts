/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";

describe("resolveLoadCoreEnvFn behavior", () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.resetModules();
    jest.restoreAllMocks();
    // no-op
  });

  it("prefers compiled core loader in production", async () => {
    process.env = { ...ORIGINAL_ENV, NODE_ENV: "production" } as NodeJS.ProcessEnv;
    await jest.isolateModulesAsync(async () => {
      const { loadCoreEnv } = await import("../../core/loader.parse.ts");
      const { resolveLoadCoreEnvFn } = await import("../../core/runtime.resolve-loader.ts");
      const fn = resolveLoadCoreEnvFn();
      // core.ts re-exports loadCoreEnv, so the resolved function should be that
      expect(fn).toBe(loadCoreEnv);
    });
  });

  it("uses direct loadCoreEnv when not preferring stub", async () => {
    process.env = { ...ORIGINAL_ENV, NODE_ENV: "development" } as NodeJS.ProcessEnv;
    await jest.isolateModulesAsync(async () => {
      const { loadCoreEnv } = await import("../../core/loader.parse.ts");
      const { resolveLoadCoreEnvFn } = await import("../../core/runtime.resolve-loader.ts");
      const fn = resolveLoadCoreEnvFn();
      expect(fn).toBe(loadCoreEnv);
    });
  });
});
