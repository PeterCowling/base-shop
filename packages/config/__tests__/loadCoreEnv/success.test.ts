import { afterEach, describe, expect,it } from "@jest/globals";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("loadCoreEnv – success", () => {
  it("returns parsed env without logging for valid env", async () => {
    const { loadCoreEnv } = await import("../../src/env/core");
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    const env = loadCoreEnv({
      CMS_SPACE_URL: "https://example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "v1",
      DEPOSIT_RELEASE_ENABLED: "true",
      DEPOSIT_RELEASE_INTERVAL_MS: "1000",
      REVERSE_LOGISTICS_ENABLED: "false",
      REVERSE_LOGISTICS_INTERVAL_MS: "2000",
      LATE_FEE_ENABLED: "true",
      LATE_FEE_INTERVAL_MS: "3000",
    } as NodeJS.ProcessEnv);

    expect(env.DEPOSIT_RELEASE_ENABLED).toBe(true);
    expect(env.DEPOSIT_RELEASE_INTERVAL_MS).toBe(1000);
    expect(env.REVERSE_LOGISTICS_ENABLED).toBe(false);
    expect(env.REVERSE_LOGISTICS_INTERVAL_MS).toBe(2000);
    expect(env.LATE_FEE_ENABLED).toBe(true);
    expect(env.LATE_FEE_INTERVAL_MS).toBe(3000);
    expect(spy).not.toHaveBeenCalled();
  });
});
