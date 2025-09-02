import { afterEach, describe, expect, it } from "@jest/globals";

describe("auth env module", () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
  });

  it("parses valid configuration", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "next-secret",
      SESSION_SECRET: "session-secret",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { authEnv } = await import("../auth.ts");
    expect(authEnv).toMatchObject({
      NEXTAUTH_SECRET: "next-secret",
      SESSION_SECRET: "session-secret",
    });
  });

  it("defaults secrets in development", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "development",
    } as NodeJS.ProcessEnv;
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.SESSION_SECRET;
    delete process.env.PREVIEW_TOKEN_SECRET;
    jest.resetModules();
    const { authEnv } = await import("../auth.ts");
    expect(authEnv).toMatchObject({
      NEXTAUTH_SECRET: "dev-nextauth-secret",
      SESSION_SECRET: "dev-session-secret",
    });
    expect(authEnv.PREVIEW_TOKEN_SECRET).toBeUndefined();
  });

  it("throws on missing or invalid configuration", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "" as unknown as string,
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../auth.ts")).rejects.toThrow(
      "Invalid auth environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        NEXTAUTH_SECRET: { _errors: [expect.any(String)] },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws when optional URLs are invalid", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "next-secret",
      SESSION_SECRET: "session-secret",
      LOGIN_RATE_LIMIT_REDIS_URL: "not-a-url",
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../auth.ts")).rejects.toThrow(
      "Invalid auth environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid auth environment variables:",
      expect.objectContaining({
        LOGIN_RATE_LIMIT_REDIS_URL: { _errors: [expect.any(String)] },
      }),
    );
    errorSpy.mockRestore();
  });
});

