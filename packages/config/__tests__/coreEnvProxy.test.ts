import { describe, it, afterEach, expect } from "@jest/globals";
import { withEnv } from "../test/utils/withEnv";

const NEXT_SECRET = "nextauth-secret-32-chars-long-string!";
const SESSION_SECRET = "session-secret-32-chars-long-string!";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("coreEnv proxy", () => {
  it("supports proxy traps", async () => {
    const core = await withEnv(
      { NODE_ENV: "test" },
      () => import("../src/env/core"),
    );
    const parseSpy = jest.spyOn(core.coreEnvSchema, "safeParse");

    expect("NODE_ENV" in core.coreEnv).toBe(true);
    expect(Object.keys(core.coreEnv)).toContain("NODE_ENV");
    const desc = Object.getOwnPropertyDescriptor(core.coreEnv, "NODE_ENV");
    expect(desc).toBeDefined();
    expect(desc?.value).toBe("test");
    expect(parseSpy).toHaveBeenCalledTimes(1);
  });

  it("caches parsed env across accesses", async () => {
    const core = await withEnv(
      {
        NODE_ENV: "test",
        CMS_SPACE_URL: "https://example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "v1",
      },
      () => import("../src/env/core"),
    );
    const parseSpy = jest.spyOn(core.coreEnvSchema, "safeParse");
    expect(parseSpy).not.toHaveBeenCalled();
    const url = core.coreEnv.CMS_SPACE_URL;
    expect(parseSpy).toHaveBeenCalledTimes(1);
    const token = core.coreEnv.CMS_ACCESS_TOKEN;
    expect(parseSpy).toHaveBeenCalledTimes(1);
    expect(core.coreEnv.CMS_SPACE_URL).toBe(url);
    expect(core.coreEnv.CMS_ACCESS_TOKEN).toBe(token);
  });

  it("parses during import in production", async () => {
    const core = await withEnv(
      {
        NODE_ENV: "production",
        CART_COOKIE_SECRET: "secret",
        NEXTAUTH_SECRET: NEXT_SECRET,
        SESSION_SECRET: SESSION_SECRET,
        CMS_SPACE_URL: "https://example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "2023-01-01",
      },
      () => import("../src/env/core"),
    );
    // Fail-fast in production should parse at import time.
    expect(core.coreEnv.NODE_ENV).toBe("production");
  });
});

