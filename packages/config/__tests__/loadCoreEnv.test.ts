import { describe, it, afterEach, expect } from "@jest/globals";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("loadCoreEnv", () => {
  it("throws and logs issues for invalid env", async () => {
    const { loadCoreEnv } = await import("../src/env/core");
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
    const { loadCoreEnv } = await import("../src/env/core");
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      loadCoreEnv({ NODE_ENV: "invalid" } as NodeJS.ProcessEnv),
    ).toThrow("Invalid core environment variables");

    expect(spy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("NODE_ENV: Invalid enum value"),
    );
  });

  it("returns parsed env without logging for valid env", async () => {
    const { loadCoreEnv } = await import("../src/env/core");
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
  it("aggregates multiple issues", async () => {
    const { loadCoreEnv } = await import("../src/env/core");
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

  it("defaults blank AUTH_TOKEN_TTL", async () => {
    const { loadCoreEnv } = await import("../src/env/core");
    const env = loadCoreEnv({
      CMS_SPACE_URL: "https://example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "v1",
      AUTH_TOKEN_TTL: "  ",
    } as NodeJS.ProcessEnv);
    expect(env.AUTH_TOKEN_TTL).toBe(900);
  });

  it("normalizes numeric AUTH_TOKEN_TTL without unit", async () => {
    const { loadCoreEnv } = await import("../src/env/core");
    const env = loadCoreEnv({
      CMS_SPACE_URL: "https://example.com",
      CMS_ACCESS_TOKEN: "token",
      SANITY_API_VERSION: "v1",
      AUTH_TOKEN_TTL: "60",
    } as NodeJS.ProcessEnv);
    expect(env.AUTH_TOKEN_TTL).toBe(60);
  });

  it("logs and throws when schema parsing fails", async () => {
    const core = await import("../src/env/core");
    const parseSpy = jest
      .spyOn(core.coreEnvSchema, "safeParse")
      .mockReturnValue({
        success: false,
        error: { issues: [{ path: ["FOO"], message: "bad", code: "custom" }] },
      } as any);
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => core.loadCoreEnv({} as NodeJS.ProcessEnv)).toThrow(
      "Invalid core environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(errorSpy).toHaveBeenCalledWith("  • FOO: bad");
    parseSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("aggregates issues from auth and email schemas", async () => {
    const { loadCoreEnv } = await import("../src/env/core");
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() =>
      loadCoreEnv({
        CMS_SPACE_URL: "https://example.com",
        CMS_ACCESS_TOKEN: "token",
        SANITY_API_VERSION: "v1",
        SESSION_STORE: "redis",
        EMAIL_PROVIDER: "sendgrid",
      } as NodeJS.ProcessEnv),
    ).toThrow("Invalid core environment variables");
    expect(spy).toHaveBeenCalledWith(
      "❌ Invalid core environment variables:",
    );
    expect(spy).toHaveBeenCalledWith(
      "  • UPSTASH_REDIS_REST_URL: UPSTASH_REDIS_REST_URL is required when SESSION_STORE=redis",
    );
    expect(spy).toHaveBeenCalledWith(
      "  • UPSTASH_REDIS_REST_TOKEN: UPSTASH_REDIS_REST_TOKEN is required when SESSION_STORE=redis",
    );
    expect(spy).toHaveBeenCalledWith(
      "  • SENDGRID_API_KEY: Required",
    );
  });
});

