/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";

describe("resolveLoadCoreEnvFn behavior", () => {
  const ORIGINAL_ENV = process.env;

  // Base env with all required production values
  const prodEnv = {
    CMS_SPACE_URL: "https://example.com",
    CMS_ACCESS_TOKEN: "token",
    SANITY_API_VERSION: "v1",
    SANITY_PROJECT_ID: "test-project",
    SANITY_DATASET: "production",
    SANITY_API_TOKEN: "test-token",
    SANITY_PREVIEW_SECRET: "preview-secret",
    EMAIL_FROM: "from@example.com",
    CART_COOKIE_SECRET: "secret",
    NEXTAUTH_SECRET: "nextauth-secret-32-chars-long-string!",
    SESSION_SECRET: "session-secret-32-chars-long-string!",
  };

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    jest.resetModules();
    jest.restoreAllMocks();
    // no-op
  });

  it("prefers compiled core loader in production", async () => {
    process.env = { ...ORIGINAL_ENV, ...prodEnv, NODE_ENV: "production" } as NodeJS.ProcessEnv;
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
