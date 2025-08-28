import { expect } from "@jest/globals";

describe("emailEnv", () => {
  const OLD_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = OLD_ENV;
    jest.restoreAllMocks();
  });

  it("throws and logs when SMTP_URL is invalid", async () => {
    process.env = {
      SMTP_URL: "notaurl",
    } as NodeJS.ProcessEnv;
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(import("../src/env/email.impl")).rejects.toThrow(
      "Invalid email environment variables",
    );
    expect(spy).toHaveBeenCalled();
  });
});
