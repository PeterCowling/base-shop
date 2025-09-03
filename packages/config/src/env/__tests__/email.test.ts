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
    "throws and logs error when SENDGRID_API_KEY is missing for sendgrid provider",
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
    "does not throw when RESEND_API_KEY is missing for resend provider",
    async () => {
      process.env = {
        ...ORIGINAL_ENV,
        EMAIL_PROVIDER: "resend",
      } as NodeJS.ProcessEnv;
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      jest.resetModules();
      const { emailEnv } = await import("../email.ts");
      expect(errorSpy).not.toHaveBeenCalled();
      expect(emailEnv).toMatchObject({ EMAIL_PROVIDER: "resend" });
      errorSpy.mockRestore();
    },
  );

  it(
    "parses resend configuration with valid RESEND_API_KEY",
    async () => {
      process.env = {
        ...ORIGINAL_ENV,
        EMAIL_PROVIDER: "resend",
        RESEND_API_KEY: "key",
      } as NodeJS.ProcessEnv;
      jest.resetModules();
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const { emailEnv } = await import("../email.ts");
      expect(errorSpy).not.toHaveBeenCalled();
      expect(emailEnv.RESEND_API_KEY).toBe("key");
      errorSpy.mockRestore();
    },
  );

  it(
    "parses sendgrid configuration with valid SENDGRID_API_KEY",
    async () => {
      process.env = {
        ...ORIGINAL_ENV,
        EMAIL_PROVIDER: "sendgrid",
        SENDGRID_API_KEY: "valid-key",
      } as NodeJS.ProcessEnv;
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      jest.resetModules();
      const { emailEnv } = await import("../email.ts");
      expect(errorSpy).not.toHaveBeenCalled();
      expect(emailEnv).toMatchObject({
        EMAIL_PROVIDER: "sendgrid",
        SENDGRID_API_KEY: "valid-key",
      });
      errorSpy.mockRestore();
    },
  );

  it(
    "throws when SENDGRID_API_KEY is not a string for sendgrid provider",
    async () => {
      process.env = {
        ...ORIGINAL_ENV,
        EMAIL_PROVIDER: "sendgrid",
        SENDGRID_API_KEY: 123 as any,
      } as unknown as NodeJS.ProcessEnv;
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
            _errors: [expect.stringContaining("Expected string")],
          },
        }),
      );
      errorSpy.mockRestore();
    },
  );

  it(
    "throws and logs formatted error for invalid SMTP_URL and non-numeric EMAIL_BATCH_SIZE",
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
      expect(errorSpy).toHaveBeenCalledTimes(1);
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

  it(
    "throws when SMTP_URL is invalid even if EMAIL_BATCH_SIZE is numeric",
    async () => {
      process.env = {
        ...ORIGINAL_ENV,
        SMTP_URL: "not-a-url",
        EMAIL_BATCH_SIZE: "5",
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
