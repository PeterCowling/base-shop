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

  it("uses cache for repeated property access", async () => {
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
    expect(core.coreEnv.CMS_SPACE_URL).toBe("https://example.com");
    expect(core.coreEnv.CMS_SPACE_URL).toBe("https://example.com");
    expect(parseSpy).toHaveBeenCalledTimes(1);
  });

  it("calls loadCoreEnv only once", async () => {
    const OLD = process.env;
    process.env = {
      ...OLD,
      CMS_SPACE_URL: "https://example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "v1",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const loaderMod = await import("../src/env/core/loader.parse.ts");
    const spy = jest.spyOn(loaderMod, "loadCoreEnv");
    const core = await import("../src/env/core");
    // Access multiple times; loader should be invoked once via proxy cache
    // The first access triggers loadCoreEnv; subsequent accesses use cached env
    // so the spy call count remains 1.
    // Access properties
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- ENG-1234 verify proxy access triggers loadCoreEnv
    core.coreEnv.CMS_SPACE_URL;
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- ENG-1234 verify proxy access triggers loadCoreEnv
    core.coreEnv.CMS_ACCESS_TOKEN;
    expect(spy).toHaveBeenCalledTimes(1);
    process.env = OLD;
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
        EMAIL_FROM: "from@example.com",
      },
      () => import("../src/env/core"),
    );
    // Fail-fast in production should parse at import time.
    expect(core.coreEnv.NODE_ENV).toBe("production");
  });
});
