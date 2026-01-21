import { afterEach, describe, expect,it } from "@jest/globals";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("loadCoreEnv – AUTH_TOKEN_TTL normalization", () => {
  it("defaults blank AUTH_TOKEN_TTL", async () => {
    const { loadCoreEnv } = await import("../../src/env/core");
    const env = loadCoreEnv({
      CMS_SPACE_URL: "https://example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "v1",
      AUTH_TOKEN_TTL: "  ",
    } as NodeJS.ProcessEnv);
    expect(env.AUTH_TOKEN_TTL).toBe(900);
  });

  it("normalizes numeric AUTH_TOKEN_TTL without unit", async () => {
    const { loadCoreEnv } = await import("../../src/env/core");
    const env = loadCoreEnv({
      CMS_SPACE_URL: "https://example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "v1",
      AUTH_TOKEN_TTL: "60",
    } as NodeJS.ProcessEnv);
    expect(env.AUTH_TOKEN_TTL).toBe(60);
  });
});
