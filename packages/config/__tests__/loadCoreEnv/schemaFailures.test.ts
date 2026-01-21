import { afterEach, describe, expect,it } from "@jest/globals";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("loadCoreEnv – schema failures", () => {
  it("logs and throws when schema parsing fails", async () => {
    const core = await import("../../src/env/core");
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
    const { loadCoreEnv } = await import("../../src/env/core");
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
