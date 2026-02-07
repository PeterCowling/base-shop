/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { NEXT_SECRET, SESSION_SECRET } from "../authEnvTestUtils.ts";

const ORIGINAL_ENV = { ...process.env };

describe("NODE_ENV branches", () => {
  const base = {
    CMS_SPACE_URL: "https://example.com",
    CMS_ACCESS_TOKEN: "token",
    SANITY_API_VERSION: "v1",
    SANITY_PROJECT_ID: "dummy-project-id",
    SANITY_DATASET: "production",
    SANITY_API_TOKEN: "dummy-api-token",
    SANITY_PREVIEW_SECRET: "dummy-preview-secret",
    NEXTAUTH_SECRET: NEXT_SECRET,
    SESSION_SECRET: SESSION_SECRET,
    EMAIL_FROM: "test@example.com",
    EMAIL_PROVIDER: "smtp",
  };

  afterEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  it.each(["development", "test"]) (
    "defaults CART_COOKIE_SECRET in %s",
    async (env) => {
      process.env = { ...base, NODE_ENV: env } as NodeJS.ProcessEnv;
      jest.resetModules();
      const { loadCoreEnv } = await import("../../core.ts");
      const parsed = loadCoreEnv();
      expect(parsed.CART_COOKIE_SECRET).toBe("dev-cart-secret");
    },
  );

  it("requires CART_COOKIE_SECRET in production", async () => {
    process.env = {
      ...base,
      NODE_ENV: "production",
      CART_COOKIE_SECRET: "secret",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { loadCoreEnv } = await import("../../core.ts");
    const env = { ...base, NODE_ENV: "production" } as NodeJS.ProcessEnv;
    delete env.CART_COOKIE_SECRET;
    expect(() => loadCoreEnv(env)).toThrow(
      "Invalid core environment variables",
    );
  });

  it("fails fast on invalid env in production", async () => {
    process.env = { ...base, NODE_ENV: "production" } as NodeJS.ProcessEnv;
    jest.resetModules();
    await expect(import("../../core.ts")).rejects.toThrow(
      "Invalid core environment variables",
    );
  });
});

