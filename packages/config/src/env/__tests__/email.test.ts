import { afterEach, describe, expect, it } from "@jest/globals";
import fs from "node:fs";

describe("email env module", () => {
  const ORIGINAL_ENV = process.env;

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
  });

  it("parses full SMTP configuration", async () => {
    process.env = {
      ...ORIGINAL_ENV,
      EMAIL_PROVIDER: "smtp",
      GMAIL_USER: "user@example.com",
      GMAIL_PASS: "pass",
      SMTP_URL: "smtp://smtp.example.com:587",
      CAMPAIGN_FROM: "no-reply@example.com",
    } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { emailEnv } = await import("../email.ts");
    expect(emailEnv).toMatchObject({
      EMAIL_PROVIDER: "smtp",
      GMAIL_USER: "user@example.com",
      GMAIL_PASS: "pass",
      SMTP_URL: "smtp://smtp.example.com:587",
      CAMPAIGN_FROM: "no-reply@example.com",
    });
  });

  it("errors when SENDGRID_API_KEY is missing for sendgrid provider", async () => {
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
        SENDGRID_API_KEY: { _errors: [expect.stringContaining("Required")] },
      }),
    );
    errorSpy.mockRestore();
  });

  it("defaults to smtp provider when EMAIL_PROVIDER is omitted", async () => {
    process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
    delete process.env.EMAIL_PROVIDER;
    jest.resetModules();
    const { emailEnv } = await import("../email.ts");
    expect(emailEnv.EMAIL_PROVIDER).toBe("smtp");
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

  it(
    "emits custom issue when SENDGRID_API_KEY is missing for sendgrid provider via safeParse",
    async () => {
      process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
      jest.resetModules();
      const { emailEnvSchema } = await import("../email.ts");
      const result = emailEnvSchema.safeParse({ EMAIL_PROVIDER: "sendgrid" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.format()).toEqual(
          expect.objectContaining({
            SENDGRID_API_KEY: {
              _errors: [expect.stringContaining("Required")],
            },
          }),
        );
      }
    },
  );

  it("accepts valid sendgrid configuration via safeParse", async () => {
    process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { emailEnvSchema } = await import("../email.ts");
    const result = emailEnvSchema.safeParse({
      EMAIL_PROVIDER: "sendgrid",
      SENDGRID_API_KEY: "key",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        EMAIL_PROVIDER: "sendgrid",
        SENDGRID_API_KEY: "key",
      });
    }
  });

  it("accepts valid resend configuration via safeParse", async () => {
    process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { emailEnvSchema } = await import("../email.ts");
    const result = emailEnvSchema.safeParse({
      EMAIL_PROVIDER: "resend",
      RESEND_API_KEY: "key",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toMatchObject({
        EMAIL_PROVIDER: "resend",
        RESEND_API_KEY: "key",
      });
    }
  });

  it(
    "applies default smtp provider via safeParse when EMAIL_PROVIDER is omitted",
    async () => {
      process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
      jest.resetModules();
      const { emailEnvSchema } = await import("../email.ts");
      const result = emailEnvSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.EMAIL_PROVIDER).toBe("smtp");
      }
    },
  );

  it(
    "logs error and throws when SENDGRID_API_KEY is missing for sendgrid provider on import",
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

  it("logs and throws for malformed SMTP_URL", async () => {
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
          SENDGRID_API_KEY: { _errors: [expect.stringContaining("Required")] },
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

  it(
    "logs and throws when SENDGRID_API_KEY is missing for sendgrid provider",
    async () => {
      const { SENDGRID_API_KEY: _unused, ...rest } = ORIGINAL_ENV;
      process.env = {
        ...rest,
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
    "imports successfully when SENDGRID_API_KEY is present for sendgrid provider",
    async () => {
      process.env = {
        ...ORIGINAL_ENV,
        EMAIL_PROVIDER: "sendgrid",
        SENDGRID_API_KEY: "test-key",
      } as NodeJS.ProcessEnv;
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      jest.resetModules();
      const { emailEnv } = await import("../email.ts");
      expect(errorSpy).not.toHaveBeenCalled();
      expect(emailEnv).toMatchObject({
        EMAIL_PROVIDER: "sendgrid",
        SENDGRID_API_KEY: "test-key",
      });
      errorSpy.mockRestore();
    },
  );

  it.each([
    {
      name: "smtp provider with url and creds",
      env: {
        EMAIL_PROVIDER: "smtp",
        GMAIL_USER: "user@example.com",
        GMAIL_PASS: "pass",
        SMTP_URL: "smtp://smtp.example.com:465",
      },
      expected: {
        EMAIL_PROVIDER: "smtp",
        GMAIL_USER: "user@example.com",
        GMAIL_PASS: "pass",
        SMTP_URL: "smtp://smtp.example.com:465",
      },
      port: 465,
    },
    {
      name: "sendgrid api provider",
      env: {
        EMAIL_PROVIDER: "sendgrid",
        SENDGRID_API_KEY: "sg-key",
      },
      expected: {
        EMAIL_PROVIDER: "sendgrid",
        SENDGRID_API_KEY: "sg-key",
      },
    },
    {
      name: "resend api provider",
      env: {
        EMAIL_PROVIDER: "resend",
        RESEND_API_KEY: "re-key",
      },
      expected: {
        EMAIL_PROVIDER: "resend",
        RESEND_API_KEY: "re-key",
      },
    },
  ])("parses %s", async ({ env, expected, port }) => {
    process.env = { ...ORIGINAL_ENV, ...env } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { emailEnv } = await import("../email.ts");
    expect(emailEnv).toMatchObject(expected);
    if (port) {
      const url = new URL(emailEnv.SMTP_URL);
      expect(Number(url.port)).toBe(port);
    }
  });

  it.each([
    {
      provider: "sendgrid",
      env: { EMAIL_PROVIDER: "sendgrid" },
    },
  ])(
    "errors when %s config missing key",
    async ({ env }) => {
      process.env = { ...ORIGINAL_ENV, ...env } as NodeJS.ProcessEnv;
      const errorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      jest.resetModules();
      await expect(import("../email.ts")).rejects.toThrow(
        "Invalid email environment variables",
      );
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    },
  );

  describe("default sender", () => {
    it("returns sender when valid", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        CAMPAIGN_FROM: "sender@example.com",
      } as NodeJS.ProcessEnv;
      delete process.env.GMAIL_USER;
      jest.resetModules();
      const { getDefaultSender } = await import(
        "../../../../email/src/config.ts"
      );
      expect(getDefaultSender()).toBe("sender@example.com");
    });

    it("throws when sender is invalid", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        CAMPAIGN_FROM: "invalid-email",
      } as NodeJS.ProcessEnv;
      delete process.env.GMAIL_USER;
      jest.resetModules();
      const { getDefaultSender } = await import(
        "../../../../email/src/config.ts"
      );
      expect(() => getDefaultSender()).toThrow(
        "Invalid sender email address",
      );
    });
  });

  describe("template base path", () => {
    it("accepts existing base path", () => {
      process.env = {
        ...ORIGINAL_ENV,
        EMAIL_TEMPLATE_BASE_PATH: __dirname,
      } as NodeJS.ProcessEnv;
      expect(
        fs.existsSync(process.env.EMAIL_TEMPLATE_BASE_PATH!),
      ).toBe(true);
    });

    it("errors when base path missing", () => {
      process.env = {
        ...ORIGINAL_ENV,
        EMAIL_TEMPLATE_BASE_PATH: "./non-existent-path",
      } as NodeJS.ProcessEnv;
      expect(
        fs.existsSync(process.env.EMAIL_TEMPLATE_BASE_PATH!),
      ).toBe(false);
    });
  });
});
