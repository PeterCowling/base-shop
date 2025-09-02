import { afterEach, describe, expect, it } from "@jest/globals";

describe("email env module", () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
  });

  it("parses valid configuration", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      EMAIL_PROVIDER: "sendgrid",
      SENDGRID_API_KEY: "api-key",
      SMTP_URL: "https://smtp.example.com",
      EMAIL_BATCH_SIZE: "10",
      EMAIL_BATCH_DELAY_MS: "20",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const { emailEnv } = await import("../email.ts");
    expect(errorSpy).not.toHaveBeenCalled();
    expect(emailEnv).toMatchObject({
      EMAIL_PROVIDER: "sendgrid",
      SENDGRID_API_KEY: "api-key",
      SMTP_URL: "https://smtp.example.com",
      EMAIL_BATCH_SIZE: 10,
      EMAIL_BATCH_DELAY_MS: 20,
    });
    errorSpy.mockRestore();
  });

  it("throws and logs error for unsupported EMAIL_PROVIDER", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      EMAIL_PROVIDER: "invalid" as unknown as NodeJS.ProcessEnv[string],
    } as NodeJS.ProcessEnv;
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(import("../email.ts")).rejects.toThrow(
      "Invalid email environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid email environment variables:",
      expect.objectContaining({
        EMAIL_PROVIDER: {
          _errors: [expect.stringContaining("Invalid enum value")],
        },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws and logs structured error for invalid SMTP_URL", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      SMTP_URL: "not-a-url",
    } as NodeJS.ProcessEnv;
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../email.ts")).rejects.toThrow(
      "Invalid email environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid email environment variables:",
      expect.objectContaining({
        SMTP_URL: { _errors: [expect.stringContaining("Invalid url")] },
      }),
    );
    errorSpy.mockRestore();
  });

  it(
    "throws and logs structured error when SENDGRID_API_KEY is missing for sendgrid provider",
    async () => {
      process.env = {
        ...ORIGINAL_ENV,
        EMAIL_PROVIDER: "sendgrid",
      } as NodeJS.ProcessEnv;
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      jest.resetModules();
      await expect(import("../email.ts")).rejects.toThrow(
        "Invalid email environment variables",
      );
      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Invalid email environment variables:",
        expect.objectContaining({
          SENDGRID_API_KEY: {
            _errors: [expect.stringContaining("Required")],
          },
        }),
      );
      errorSpy.mockRestore();
    },
  );

  it(
    "reports multiple errors for invalid SMTP_URL and non-numeric EMAIL_BATCH_SIZE",
    async () => {
      process.env = {
        ...ORIGINAL_ENV,
        SMTP_URL: "not-a-url",
        EMAIL_BATCH_SIZE: "many",
      } as NodeJS.ProcessEnv;
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      jest.resetModules();
      await expect(import("../email.ts")).rejects.toThrow(
        "Invalid email environment variables",
      );
      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Invalid email environment variables:",
        expect.objectContaining({
          SMTP_URL: {
            _errors: [expect.stringContaining("Invalid url")],
          },
          EMAIL_BATCH_SIZE: {
            _errors: [expect.stringContaining("Expected number")],
          },
        }),
      );
      errorSpy.mockRestore();
    },
  );

  it("defaults EMAIL_PROVIDER to smtp when unset in development", async () => {
    process.env = { ...ORIGINAL_ENV, NODE_ENV: "development" } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { emailEnv } = await import("../email.ts");
    expect(emailEnv.EMAIL_PROVIDER).toBe("smtp");
  });

  it("parses numeric batch settings", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      EMAIL_BATCH_SIZE: "5",
      EMAIL_BATCH_DELAY_MS: "10",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { emailEnv } = await import("../email.ts");
    expect(emailEnv.EMAIL_BATCH_SIZE).toBe(5);
    expect(emailEnv.EMAIL_BATCH_DELAY_MS).toBe(10);
  });

  it("allows missing optional batch settings", async () => {
    process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { emailEnv } = await import("../email.ts");
    expect(emailEnv.EMAIL_BATCH_SIZE).toBeUndefined();
    expect(emailEnv.EMAIL_BATCH_DELAY_MS).toBeUndefined();
  });

  it("reports non-numeric EMAIL_BATCH_SIZE", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      EMAIL_BATCH_SIZE: "many",
    } as NodeJS.ProcessEnv;
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    jest.resetModules();
    await expect(import("../email.ts")).rejects.toThrow(
      "Invalid email environment variables",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid email environment variables:",
      expect.objectContaining({
        EMAIL_BATCH_SIZE: {
          _errors: [expect.stringContaining("Expected number")],
        },
      }),
    );
    errorSpy.mockRestore();
  });
});
