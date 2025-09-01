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
    await expect(import("../src/env/email")).rejects.toThrow(
      "Invalid email environment variables",
    );
    expect(spy).toHaveBeenCalled();
  });

  it("parses numeric strings and applies defaults", async () => {
    process.env = {
      GMAIL_USER: "a",
      SMTP_URL: "https://smtp",
      EMAIL_BATCH_SIZE: "10",
    } as NodeJS.ProcessEnv;
    const { emailEnv } = await import("../src/env/email");
    expect(emailEnv.GMAIL_USER).toBe("a");
    expect(emailEnv.SMTP_URL).toBe("https://smtp");
    expect(emailEnv.EMAIL_BATCH_SIZE).toBe(10);
    expect(emailEnv.EMAIL_PROVIDER).toBe("smtp");
  });

  it("throws and logs when EMAIL_BATCH_SIZE is non-numeric", async () => {
    process.env = {
      GMAIL_USER: "a",
      SMTP_URL: "https://smtp",
      EMAIL_BATCH_SIZE: "abc",
    } as NodeJS.ProcessEnv;
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(import("../src/env/email")).rejects.toThrow(
      "Invalid email environment variables",
    );
    expect(spy).toHaveBeenCalled();
  });
});
