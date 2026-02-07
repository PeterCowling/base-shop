/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";

import { NEXT_SECRET, SESSION_SECRET } from "../authEnvTestUtils.ts";

describe("loadCoreEnv required variable validation", () => {
  const snapshot = process.env;
  const base = {
    CMS_SPACE_URL: "https://example.com",
    CMS_ACCESS_TOKEN: "token",
    SANITY_API_VERSION: "v1",
    SANITY_PROJECT_ID: "dummy-project-id",
    SANITY_DATASET: "production",
    SANITY_API_TOKEN: "dummy-api-token",
    SANITY_PREVIEW_SECRET: "dummy-preview-secret",
    NODE_ENV: "production",
    CART_COOKIE_SECRET: "secret",
    NEXTAUTH_SECRET: NEXT_SECRET,
    SESSION_SECRET: SESSION_SECRET,
    EMAIL_FROM: "test@example.com",
    EMAIL_PROVIDER: "smtp",
  } as NodeJS.ProcessEnv;

  afterEach(() => {
    jest.resetModules();
    process.env = snapshot;
  });

  it.each([
    ["present", "https://example.com", true],
    ["missing", undefined, false],
    ["empty", "", false],
    ["whitespace", "   ", false],
    ["invalid", "not-a-url", false],
  ])("CMS_SPACE_URL: %s", async (_label, value, ok) => {
    jest.resetModules();
    Object.assign(process.env, base);
    const { loadCoreEnv } = await import("../../core.ts");
    const env = { ...base } as NodeJS.ProcessEnv;
    if (value === undefined) delete env.CMS_SPACE_URL;
    else env.CMS_SPACE_URL = value;
    const run = () => loadCoreEnv(env);
    if (ok) {
      expect(run).not.toThrow();
    } else {
      expect(run).toThrow("Invalid core environment variables");
    }
  });

  it.each([
    ["present", "secret", true],
    ["missing", undefined, false],
    ["empty", "", false],
    ["whitespace", "   ", true],
  ])("CART_COOKIE_SECRET: %s", async (_label, value, ok) => {
    jest.resetModules();
    Object.assign(process.env, base);
    const { loadCoreEnv } = await import("../../core.ts");
    const env = {
      ...base,
      CMS_SPACE_URL: "https://example.com",
    } as NodeJS.ProcessEnv;
    if (value === undefined) delete env.CART_COOKIE_SECRET;
    else env.CART_COOKIE_SECRET = value;
    const run = () => loadCoreEnv(env);
    if (ok) {
      expect(run).not.toThrow();
    } else {
      expect(run).toThrow("Invalid core environment variables");
    }
  });
});
