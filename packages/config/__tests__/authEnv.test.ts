import { expect } from "@jest/globals";

describe("authEnv", () => {
  const OLD_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  it("uses development defaults for secrets", async () => {
    process.env = {
      NODE_ENV: "development",
    } as NodeJS.ProcessEnv;

    const { authEnv } = await import("../src/env/auth");

    expect(authEnv.NEXTAUTH_SECRET).toBe("dev-nextauth-secret");
    expect(authEnv.SESSION_SECRET).toBe("dev-session-secret");
  });

  it("throws and logs when NEXTAUTH_SECRET is missing in production", async () => {
    process.env = {
      NODE_ENV: "production",
    } as NodeJS.ProcessEnv;

    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(import("../src/env/auth")).rejects.toThrow(
      "Invalid auth environment variables",
    );
    expect(spy).toHaveBeenCalled();
  });

  it("throws and logs when SESSION_SECRET is missing in production", async () => {
    process.env = {
      NODE_ENV: "production",
      NEXTAUTH_SECRET: "x",
    } as NodeJS.ProcessEnv;

    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(import("../src/env/auth")).rejects.toThrow(
      "Invalid auth environment variables",
    );
    expect(spy).toHaveBeenCalled();
  });
});
