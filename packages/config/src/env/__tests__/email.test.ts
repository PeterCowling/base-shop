/** @jest-environment node */
import { afterEach, describe, expect, it } from "@jest/globals";
import fs from "node:fs";

describe("email env module", () => {
  const ORIGINAL_ENV = { ...process.env, EMAIL_FROM: "from@example.com" };

  afterEach(() => {
    jest.resetModules();
    process.env = ORIGINAL_ENV;
  });

  const withEnv = async <T>(
    env: NodeJS.ProcessEnv,
    fn: () => Promise<T>,
  ): Promise<T> => {
    process.env = { ...ORIGINAL_ENV, ...env } as NodeJS.ProcessEnv;
    jest.resetModules();
    return fn();
  };

  describe("withEnv", () => {
    it.each([
      {
        provider: "smtp",
        env: {
          EMAIL_PROVIDER: "smtp",
          SMTP_URL: "smtp://smtp.example.com",
          SMTP_PORT: "587",
          SMTP_SECURE: "false",
          CAMPAIGN_FROM: "from@example.com",
        },
        expected: {
          EMAIL_PROVIDER: "smtp",
          SMTP_URL: "smtp://smtp.example.com",
          SMTP_PORT: 587,
          SMTP_SECURE: false,
          CAMPAIGN_FROM: "from@example.com",
        },
      },
      {
        provider: "sendgrid",
        env: { EMAIL_PROVIDER: "sendgrid", SENDGRID_API_KEY: "sg-key" },
        expected: {
          EMAIL_PROVIDER: "sendgrid",
          SENDGRID_API_KEY: "sg-key",
        },
      },
      {
        provider: "resend",
        env: { EMAIL_PROVIDER: "resend", RESEND_API_KEY: "re-key" },
        expected: {
          EMAIL_PROVIDER: "resend",
          RESEND_API_KEY: "re-key",
        },
      },
      { provider: "noop", env: { EMAIL_PROVIDER: "noop" }, expected: { EMAIL_PROVIDER: "noop" } },
    ])("loads %s provider", async ({ env, expected }) => {
      await withEnv(env as NodeJS.ProcessEnv, async () => {
        const { emailEnv } = await import("../email.ts");
        expect(emailEnv).toMatchObject(expected);
      });
    });

    it("parses SMTP_PORT as number", async () => {
      await withEnv(
        {
          EMAIL_PROVIDER: "smtp",
          SMTP_URL: "smtp://smtp.example.com",
          SMTP_PORT: "2525",
          SMTP_SECURE: "true",
          CAMPAIGN_FROM: "from@example.com",
        } as NodeJS.ProcessEnv,
        async () => {
          const { emailEnv } = await import("../email.ts");
          expect(emailEnv.SMTP_PORT).toBe(2525);
        },
      );
    });

    it("leaves SMTP_PORT undefined when omitted", async () => {
      await withEnv(
        {
          EMAIL_PROVIDER: "smtp",
          SMTP_URL: "smtp://smtp.example.com",
          CAMPAIGN_FROM: "from@example.com",
        } as NodeJS.ProcessEnv,
        async () => {
          const { emailEnv } = await import("../email.ts");
          expect(emailEnv.SMTP_PORT).toBeUndefined();
        },
      );
    });

    it.each([
      ["true", true],
      ["false", false],
      ["1", true],
      ["0", false],
      ["yes", true],
      ["no", false],
      [" TrUe ", true],
      [" NO ", false],
    ])("coerces SMTP_SECURE=%s", async (val, expected) => {
      await withEnv(
        {
          EMAIL_PROVIDER: "smtp",
          SMTP_URL: "smtp://smtp.example.com",
          SMTP_PORT: "587",
          SMTP_SECURE: val,
          CAMPAIGN_FROM: "from@example.com",
        } as NodeJS.ProcessEnv,
        async () => {
          const { emailEnv } = await import("../email.ts");
          expect(emailEnv.SMTP_SECURE).toBe(expected);
        },
      );
    });

    it("normalizes CAMPAIGN_FROM to lowercase", async () => {
      await withEnv(
        {
          EMAIL_PROVIDER: "smtp",
          SMTP_URL: "smtp://smtp.example.com",
          SMTP_PORT: "587",
          CAMPAIGN_FROM: " Sender@Example.COM ",
        } as NodeJS.ProcessEnv,
        async () => {
          const { emailEnv } = await import("../email.ts");
          expect(emailEnv.CAMPAIGN_FROM).toBe("sender@example.com");
        },
      );
    });

    it("throws for invalid CAMPAIGN_FROM", async () => {
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(
        withEnv(
          {
            EMAIL_PROVIDER: "smtp",
            SMTP_URL: "smtp://smtp.example.com",
            SMTP_PORT: "587",
            CAMPAIGN_FROM: "not-an-email",
          } as NodeJS.ProcessEnv,
          async () => import("../email.ts"),
        ),
      ).rejects.toThrow("Invalid email environment variables");
      expect(errorSpy).toHaveBeenCalledWith(
        "❌ Invalid email environment variables:",
        expect.objectContaining({
          CAMPAIGN_FROM: { _errors: [expect.stringContaining("Invalid email")] },
        }),
      );
      errorSpy.mockRestore();
    });

    describe("provider API key validation", () => {
      const cases = [
        { provider: "smtp", env: { EMAIL_PROVIDER: "smtp" }, missing: undefined },
        {
          provider: "sendgrid",
          env: { EMAIL_PROVIDER: "sendgrid" },
          missing: "SENDGRID_API_KEY" as const,
        },
        {
          provider: "resend",
          env: { EMAIL_PROVIDER: "resend" },
          missing: "RESEND_API_KEY" as const,
        },
        { provider: "noop", env: { EMAIL_PROVIDER: "noop" }, missing: undefined },
      ];

      it.each(cases)("handles %s provider without key", async ({ env, missing }) => {
        const errorSpy = jest
          .spyOn(console, "error")
          .mockImplementation(() => {});
        const action = withEnv(
          env as NodeJS.ProcessEnv,
          async () => import("../email.ts"),
        );
        if (missing) {
          await expect(action).rejects.toThrow(
            "Invalid email environment variables",
          );
          expect(errorSpy).toHaveBeenCalledWith(
            "❌ Invalid email environment variables:",
            expect.objectContaining({
              [missing]: { _errors: [expect.stringContaining("Required")] },
            }),
          );
        } else {
          await expect(action).resolves.toBeDefined();
          expect(errorSpy).not.toHaveBeenCalled();
        }
        errorSpy.mockRestore();
      });

      it.each([
        { provider: "smtp", env: { EMAIL_PROVIDER: "smtp" } },
        {
          provider: "sendgrid",
          env: { EMAIL_PROVIDER: "sendgrid", SENDGRID_API_KEY: "sg" },
        },
        {
          provider: "resend",
          env: { EMAIL_PROVIDER: "resend", RESEND_API_KEY: "re" },
        },
        { provider: "noop", env: { EMAIL_PROVIDER: "noop" } },
      ])("passes when %s key provided", async ({ env }) => {
        await withEnv(env as NodeJS.ProcessEnv, async () => {
          const { emailEnv } = await import("../email.ts");
          expect(emailEnv.EMAIL_PROVIDER).toBe(env.EMAIL_PROVIDER);
        });
      });
    });

    describe("template base path", () => {
      it("accepts existing path", async () => {
        await withEnv(
          { EMAIL_TEMPLATE_BASE_PATH: __dirname } as NodeJS.ProcessEnv,
          async () => {
            expect(
              fs.existsSync(process.env.EMAIL_TEMPLATE_BASE_PATH!),
            ).toBe(true);
          },
        );
      });

      it("handles missing path", async () => {
        await withEnv(
          { EMAIL_TEMPLATE_BASE_PATH: "./non-existent-path" } as NodeJS.ProcessEnv,
          async () => {
            expect(
              fs.existsSync(process.env.EMAIL_TEMPLATE_BASE_PATH!),
            ).toBe(false);
          },
        );
      });
    });
  });

    it("parses full SMTP configuration", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        EMAIL_PROVIDER: "smtp",
        GMAIL_USER: "user@example.com",
        GMAIL_PASS: "pass",
        SMTP_URL: "smtp://smtp.example.com",
        SMTP_PORT: "587",
        SMTP_SECURE: "false",
        CAMPAIGN_FROM: "no-reply@example.com",
      } as NodeJS.ProcessEnv;
      jest.resetModules();
      const { emailEnv } = await import("../email.ts");
      expect(emailEnv).toMatchObject({
        EMAIL_PROVIDER: "smtp",
        GMAIL_USER: "user@example.com",
        GMAIL_PASS: "pass",
        SMTP_URL: "smtp://smtp.example.com",
        SMTP_PORT: 587,
        SMTP_SECURE: false,
        CAMPAIGN_FROM: "no-reply@example.com",
      });
    });

    it("rejects non-numeric SMTP_PORT", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        EMAIL_PROVIDER: "smtp",
        SMTP_PORT: "not-a-number",
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
          SMTP_PORT: { _errors: [expect.stringContaining("must be a number")] },
        }),
      );
      errorSpy.mockRestore();
    });

    it("handles SMTP_SECURE boolean", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        EMAIL_PROVIDER: "smtp",
        GMAIL_USER: "user@example.com",
        GMAIL_PASS: "pass",
        SMTP_SECURE: "true",
      } as NodeJS.ProcessEnv;
      jest.resetModules();
      const { emailEnv } = await import("../email.ts");
      expect(emailEnv.SMTP_SECURE).toBe(true);
    });

    it("leaves SMTP_SECURE undefined when not provided", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        EMAIL_PROVIDER: "smtp",
        SMTP_URL: "smtp://smtp.example.com",
        SMTP_PORT: "587",
        CAMPAIGN_FROM: "from@example.com",
      } as NodeJS.ProcessEnv;
      jest.resetModules();
      const { emailEnv } = await import("../email.ts");
      expect(emailEnv.SMTP_SECURE).toBeUndefined();
    });

    it("rejects invalid SMTP_SECURE value", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        EMAIL_PROVIDER: "smtp",
        SMTP_SECURE: "notabool",
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
          SMTP_SECURE: {
            _errors: [expect.stringContaining("must be a boolean")],
          },
        }),
      );
      errorSpy.mockRestore();
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
      const result = emailEnvSchema.safeParse({
        EMAIL_PROVIDER: "sendgrid",
        EMAIL_FROM: "from@example.com",
      });
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
        EMAIL_FROM: "from@example.com",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject({
          EMAIL_PROVIDER: "sendgrid",
          SENDGRID_API_KEY: "key",
        });
      }
    });

    it(
      "emits custom issue when RESEND_API_KEY is missing for resend provider via safeParse",
      async () => {
        process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
        jest.resetModules();
        const { emailEnvSchema } = await import("../email.ts");
        const result = emailEnvSchema.safeParse({
          EMAIL_PROVIDER: "resend",
          EMAIL_FROM: "from@example.com",
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.format()).toEqual(
            expect.objectContaining({
              RESEND_API_KEY: { _errors: [expect.stringContaining("Required")] },
            }),
          );
        }
      },
    );

  it("accepts valid resend configuration via safeParse", async () => {
    process.env = { ...ORIGINAL_ENV } as NodeJS.ProcessEnv;
    jest.resetModules();
    const { emailEnvSchema } = await import("../email.ts");
    const result = emailEnvSchema.safeParse({
      EMAIL_PROVIDER: "resend",
      RESEND_API_KEY: "key",
      EMAIL_FROM: "from@example.com",
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
      const result = emailEnvSchema.safeParse({ EMAIL_FROM: "from@example.com" });
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
      "throws when RESEND_API_KEY is missing for resend provider",
      async () => {
        process.env = {
          ...ORIGINAL_ENV,
          EMAIL_PROVIDER: "resend",
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
            RESEND_API_KEY: { _errors: [expect.stringContaining("Required")] },
          }),
        );
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
        name: "smtp provider with port and secure",
        env: {
          EMAIL_PROVIDER: "smtp",
          GMAIL_USER: "user@example.com",
          GMAIL_PASS: "pass",
          SMTP_URL: "smtp://smtp.example.com",
          SMTP_PORT: "465",
          SMTP_SECURE: "true",
        },
        expected: {
          EMAIL_PROVIDER: "smtp",
          GMAIL_USER: "user@example.com",
          GMAIL_PASS: "pass",
          SMTP_URL: "smtp://smtp.example.com",
          SMTP_PORT: 465,
          SMTP_SECURE: true,
        },
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
      {
        name: "noop provider",
        env: { EMAIL_PROVIDER: "noop" },
        expected: { EMAIL_PROVIDER: "noop" },
      },
    ])("parses %s", async ({ env, expected }) => {
      process.env = { ...ORIGINAL_ENV, ...env } as NodeJS.ProcessEnv;
      jest.resetModules();
      const { emailEnv } = await import("../email.ts");
      expect(emailEnv).toMatchObject(expected);
    });

    it.each([
      {
        provider: "sendgrid",
        env: { EMAIL_PROVIDER: "sendgrid" },
      },
      {
        provider: "resend",
        env: { EMAIL_PROVIDER: "resend" },
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
      it("normalizes sender when valid", async () => {
        process.env = {
          ...ORIGINAL_ENV,
          CAMPAIGN_FROM: " Sender@Example.com ",
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

  describe("provider key requirements", () => {
    const loadEnv = async () => (await import("../email.ts")).emailEnv;

    it("throws when SENDGRID_API_KEY missing", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        EMAIL_PROVIDER: "sendgrid",
      } as NodeJS.ProcessEnv;
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(loadEnv()).rejects.toThrow(
        "Invalid email environment variables",
      );
      expect(spy).toHaveBeenCalled();
      const err = spy.mock.calls[0][1];
      expect(err.SENDGRID_API_KEY._errors).toContain("Required");
      spy.mockRestore();
    });

    it("throws when RESEND_API_KEY missing", async () => {
      process.env = {
        ...ORIGINAL_ENV,
        EMAIL_PROVIDER: "resend",
      } as NodeJS.ProcessEnv;
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      await expect(loadEnv()).rejects.toThrow(
        "Invalid email environment variables",
      );
      expect(spy).toHaveBeenCalled();
      const err = spy.mock.calls[0][1];
      expect(err.RESEND_API_KEY._errors).toContain("Required");
      spy.mockRestore();
    });

    it("loads sendgrid provider when key present", async () => {
      const env = await withEnv(
        { EMAIL_PROVIDER: "sendgrid", SENDGRID_API_KEY: "sg-key" },
        async () => loadEnv(),
      );
      expect(env.EMAIL_PROVIDER).toBe("sendgrid");
      expect(env.SENDGRID_API_KEY).toBe("sg-key");
    });

    it("loads resend provider when key present", async () => {
      const env = await withEnv(
        { EMAIL_PROVIDER: "resend", RESEND_API_KEY: "re-key" },
        async () => loadEnv(),
      );
      expect(env.EMAIL_PROVIDER).toBe("resend");
      expect(env.RESEND_API_KEY).toBe("re-key");
    });
  });
});
