import { afterEach, describe, expect,it } from "@jest/globals";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("loadCoreEnv – errors", () => {
  it("throws and logs issues for invalid env", async () => {
    const { loadCoreEnv } = await import("../../src/env/core");
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      loadCoreEnv({
        CMS_SPACE_URL: "https://example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "v1",
        DEPOSIT_RELEASE_ENABLED: "maybe",
      } as NodeJS.ProcessEnv),
    ).toThrow("Invalid core environment variables");

    expect(spy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(spy).toHaveBeenCalledWith(
      "  • DEPOSIT_RELEASE_ENABLED: must be true or false",
    );
  });

  it("logs base schema issue for invalid NODE_ENV", async () => {
    const { loadCoreEnv } = await import("../../src/env/core");
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      loadCoreEnv({ NODE_ENV: "invalid" } as NodeJS.ProcessEnv),
    ).toThrow("Invalid core environment variables");

    expect(spy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    // Zod error message format may vary - check for NODE_ENV and "Invalid"
    expect(spy).toHaveBeenCalledWith(
      expect.stringMatching(/NODE_ENV:.*Invalid/i),
    );
  });

  it("aggregates multiple issues", async () => {
    const { loadCoreEnv } = await import("../../src/env/core");
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({
        CMS_SPACE_URL: "https://example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "v1",
        DEPOSIT_RELEASE_ENABLED: "maybe",
        DEPOSIT_RELEASE_INTERVAL_MS: "soon",
        REVERSE_LOGISTICS_INTERVAL_MS: "later",
      } as NodeJS.ProcessEnv),
    ).toThrow("Invalid core environment variables");
    expect(spy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(spy).toHaveBeenCalledWith(
      "  • DEPOSIT_RELEASE_ENABLED: must be true or false",
    );
    expect(spy).toHaveBeenCalledWith(
      "  • DEPOSIT_RELEASE_INTERVAL_MS: must be a number",
    );
    expect(spy).toHaveBeenCalledWith(
      "  • REVERSE_LOGISTICS_INTERVAL_MS: must be a number",
    );
  });
});
