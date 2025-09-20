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

describe("loadCoreEnv boolean parsing", () => {
  const base = {
    ...baseEnv,
    CART_COOKIE_SECRET: "secret",
    NODE_ENV: "test",
    NEXTAUTH_SECRET: NEXT_SECRET,
    SESSION_SECRET: SESSION_SECRET,
  } as NodeJS.ProcessEnv;

  afterEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  it.each([
    ["true", true],
    ["false", true],
    ["1", true],
    ["0", true],
    ["yes", true],
    ["no", true],
    [" TRUE ", true],
    [" False ", true],
    [" 1 ", true],
    ["0 ", true],
    [" Yes ", true],
    [" no ", true],
  ])("OUTPUT_EXPORT parses %s", async (input, expected) => {
    process.env = { ...base, OUTPUT_EXPORT: input };
    const { loadCoreEnv } = await import("../../core.ts");
    const env = loadCoreEnv();
    expect(env.OUTPUT_EXPORT).toBe(expected);
  });

  it.each([
    ["true", true],
    ["false", false],
  ])("DEPOSIT_RELEASE_ENABLED accepts %s", async (input, expected) => {
    process.env = { ...base, DEPOSIT_RELEASE_ENABLED: input };
    const { loadCoreEnv } = await import("../../core.ts");
    const env = loadCoreEnv();
    expect(env.DEPOSIT_RELEASE_ENABLED).toBe(expected);
  });

  it.each(["1", "0", "yes", "no", " TRUE ", " false "]) (
    "DEPOSIT_RELEASE_ENABLED rejects %s",
    async (input) => {
      process.env = { ...base, DEPOSIT_RELEASE_ENABLED: input };
      const { loadCoreEnv } = await import("../../core.ts");
      expect(() => loadCoreEnv()).toThrow("Invalid core environment variables");
    },
  );
});

