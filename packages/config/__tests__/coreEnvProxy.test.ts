import { describe, it, afterEach, expect } from "@jest/globals";
import { withEnv } from "../test/utils/withEnv";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("coreEnv proxy", () => {
  it("supports proxy traps", async () => {
    const core = await withEnv(
      { NODE_ENV: "test" },
      () => import("../src/env/core"),
    );

    expect("NODE_ENV" in core.coreEnv).toBe(true);
    expect(Object.keys(core.coreEnv)).toContain("NODE_ENV");
    const desc = Object.getOwnPropertyDescriptor(core.coreEnv, "NODE_ENV");
    expect(desc).toBeDefined();
    expect(desc?.value).toBe("test");
  });

  it("parses during import in production", async () => {
    const core = await withEnv(
      {
        NODE_ENV: "production",
        CART_COOKIE_SECRET: "secret",
        NEXTAUTH_SECRET: "nextauth",
        SESSION_SECRET: "session",
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

