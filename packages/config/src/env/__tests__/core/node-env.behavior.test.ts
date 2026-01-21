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

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  jest.resetModules();
  jest.restoreAllMocks();
});

describe("loadCoreEnv NODE_ENV handling", () => {
  const base = { ...baseEnv };

  it("handles production", () => {
    const { loadCoreEnv } = require("../../core.ts");
    const env = loadCoreEnv({
      ...base,
      NODE_ENV: "production",
      CART_COOKIE_SECRET: "secret",
    } as NodeJS.ProcessEnv);
    expect(env.NODE_ENV).toBe("production");
    expect(env.CART_COOKIE_SECRET).toBe("secret");
  });

  it.each(["development", "test"]) (
    "defaults secret in %s",
    (nodeEnv) => {
      const { loadCoreEnv } = require("../../core.ts");
      const env = loadCoreEnv({
        ...base,
        NODE_ENV: nodeEnv,
      } as NodeJS.ProcessEnv);
      expect(env.NODE_ENV).toBe(nodeEnv);
      expect(env.CART_COOKIE_SECRET).toBe("dev-cart-secret");
    },
  );
});

describe("coreEnv proxy NODE_ENV behavior", () => {
  const base = {
    ...baseEnv,
    SANITY_PROJECT_ID: "dummy-project-id",
    SANITY_DATASET: "production",
    SANITY_API_TOKEN: "dummy-api-token",
    SANITY_PREVIEW_SECRET: "dummy-preview-secret",
    CART_COOKIE_SECRET: "secret",
    EMAIL_PROVIDER: "smtp",
    NEXTAUTH_SECRET: NEXT_SECRET,
    SESSION_SECRET: SESSION_SECRET,
  } as NodeJS.ProcessEnv;

  it.each(["development", "test"]) (
    "lazy loads in %s",
    async (env) => {
      process.env = { ...base, NODE_ENV: env } as NodeJS.ProcessEnv;
      jest.resetModules();
      const mod = await import("../../core.ts");
      const loadSpy = jest.spyOn(mod, "loadCoreEnv");
      expect(loadSpy).not.toHaveBeenCalled();
      expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://example.com");
      expect(loadSpy).not.toHaveBeenCalled();
    },
  );

  it("eager loads in production", async () => {
    process.env = {
      ...base,
      NODE_ENV: "production",
      CART_COOKIE_SECRET: "secret",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const mod = await import("../../core.ts");
    const loadSpy = jest.spyOn(mod, "loadCoreEnv");
    loadSpy.mockClear();
    expect(mod.coreEnv.CMS_SPACE_URL).toBe("https://example.com");
    expect(loadSpy).not.toHaveBeenCalled();
  });
});

