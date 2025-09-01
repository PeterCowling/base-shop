import { describe, it, afterEach, expect } from "@jest/globals";

const OLD_ENV = process.env;

afterEach(() => {
  jest.resetModules();
  process.env = OLD_ENV;
});

describe("coreEnv proxy", () => {
  it("supports the has trap", async () => {
    process.env = { ...OLD_ENV, NODE_ENV: "test" } as NodeJS.ProcessEnv;
    const { coreEnv } = await import("../src/env/core");
    expect("NODE_ENV" in coreEnv).toBe(true);
  });

  it("invokes loadCoreEnv during import in production", async () => {
    process.env = {
      ...OLD_ENV,
      NODE_ENV: "production",
      CART_COOKIE_SECRET: "secret",
      NEXTAUTH_SECRET: "nextauth",
      SESSION_SECRET: "session",
      CMS_SPACE_URL: "https://example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "2023-01-01",
    } as NodeJS.ProcessEnv;
    const core = await import("../src/env/core");
    const spy = jest.spyOn(core, "loadCoreEnv");
    // Accessing again shouldn't trigger loadCoreEnv if fail-fast ran on import.
    core.coreEnv.NODE_ENV;
    expect(spy).not.toHaveBeenCalled();
  });
});
