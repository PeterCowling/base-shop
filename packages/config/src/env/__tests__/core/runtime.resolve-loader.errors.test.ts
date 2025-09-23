/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";

describe("resolveLoadCoreEnvFn error fallback handling", () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it.each(["ERR_REQUIRE_ESM", "ERR_UNKNOWN_FILE_EXTENSION"]) (
    "falls back to direct loader when require throws %s",
    async (code) => {
      process.env = { ...ORIGINAL_ENV, NODE_ENV: "production" } as NodeJS.ProcessEnv;

      const err: any = new Error(String(code));
      (err as any).code = code;
      // The runtime.resolve-loader uses require("../core.js"), which maps to ../../core.ts via Jest config
      jest.doMock("../../core.ts", () => { throw err; }, { virtual: true });

      await jest.isolateModulesAsync(async () => {
        const { loadCoreEnv } = await import("../../core/loader.parse.ts");
        const { resolveLoadCoreEnvFn } = await import("../../core/runtime.resolve-loader.ts");
        const fn = resolveLoadCoreEnvFn();
        expect(fn).toBe(loadCoreEnv);
      });
    },
  );
});

