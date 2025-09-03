import { expect } from "@jest/globals";

describe("env index validation", () => {
  const OLD_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  it("throws and logs on invalid environment variables", async () => {
    process.env = {
      ...OLD_ENV,
      DEPOSIT_RELEASE_INTERVAL_MS: "abc",
    } as NodeJS.ProcessEnv;

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(import("../src/env/index")).rejects.toThrow(
      "Invalid environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid environment variables:",
      expect.objectContaining({
        DEPOSIT_RELEASE_INTERVAL_MS: { _errors: ["must be a number"] },
      }),
    );
  });

  it("succeeds with valid environment variables", async () => {
    process.env = {
      ...OLD_ENV,
      DEPOSIT_RELEASE_INTERVAL_MS: "1000",
    } as NodeJS.ProcessEnv;

    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const mod = await import("../src/env/index");
    expect(mod.env.DEPOSIT_RELEASE_INTERVAL_MS).toBe(1000);
    expect(errorSpy).not.toHaveBeenCalled();
  });
});

