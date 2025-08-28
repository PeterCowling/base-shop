import { expect } from "@jest/globals";

describe("authEnv", () => {
  const OLD_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  it("throws and logs when NEXTAUTH_SECRET is missing in production", async () => {
    process.env = {
      NODE_ENV: "production",
    } as NodeJS.ProcessEnv;

    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    await expect(import("../src/env/auth.impl")).rejects.toThrow(
      "Invalid auth environment variables",
    );
    expect(spy).toHaveBeenCalled();
  });
});
