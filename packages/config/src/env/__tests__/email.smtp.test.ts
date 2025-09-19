/** @jest-environment node */
import { afterEach, describe, expect, it, jest } from "@jest/globals";

import {
  loadEmailEnv,
  resetEmailEnv,
  spyOnConsoleError,
  withEmailEnv,
} from "./email.test-helpers";

afterEach(() => {
  resetEmailEnv();
  jest.clearAllMocks();
});

describe("email env smtp configuration", () => {
  it("parses full SMTP configuration", async () => {
    await withEmailEnv(
      {
        EMAIL_PROVIDER: "smtp",
        GMAIL_USER: "user@example.com",
        GMAIL_PASS: "pass",
        SMTP_URL: "smtp://smtp.example.com",
        SMTP_PORT: "587",
        SMTP_SECURE: "false",
        CAMPAIGN_FROM: "no-reply@example.com",
      } as NodeJS.ProcessEnv,
      async () => {
        const emailEnv = await loadEmailEnv();
        expect(emailEnv).toMatchObject({
          EMAIL_PROVIDER: "smtp",
          GMAIL_USER: "user@example.com",
          GMAIL_PASS: "pass",
          SMTP_URL: "smtp://smtp.example.com",
          SMTP_PORT: 587,
          SMTP_SECURE: false,
          CAMPAIGN_FROM: "no-reply@example.com",
        });
      },
    );
  });

  it("parses SMTP_PORT as number", async () => {
    await withEmailEnv(
      {
        EMAIL_PROVIDER: "smtp",
        SMTP_URL: "smtp://smtp.example.com",
        SMTP_PORT: "2525",
        SMTP_SECURE: "true",
        CAMPAIGN_FROM: "from@example.com",
      } as NodeJS.ProcessEnv,
      async () => {
        const emailEnv = await loadEmailEnv();
        expect(emailEnv.SMTP_PORT).toBe(2525);
      },
    );
  });

  it("leaves SMTP_PORT undefined when omitted", async () => {
    await withEmailEnv(
      {
        EMAIL_PROVIDER: "smtp",
        SMTP_URL: "smtp://smtp.example.com",
        CAMPAIGN_FROM: "from@example.com",
      } as NodeJS.ProcessEnv,
      async () => {
        const emailEnv = await loadEmailEnv();
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
  ])("coerces SMTP_SECURE=%s", async (value, expected) => {
    await withEmailEnv(
      {
        EMAIL_PROVIDER: "smtp",
        SMTP_URL: "smtp://smtp.example.com",
        SMTP_PORT: "587",
        SMTP_SECURE: value,
        CAMPAIGN_FROM: "from@example.com",
      } as NodeJS.ProcessEnv,
      async () => {
        const emailEnv = await loadEmailEnv();
        expect(emailEnv.SMTP_SECURE).toBe(expected);
      },
    );
  });

  it("leaves SMTP_SECURE undefined when not provided", async () => {
    await withEmailEnv(
      {
        EMAIL_PROVIDER: "smtp",
        SMTP_URL: "smtp://smtp.example.com",
        SMTP_PORT: "587",
        CAMPAIGN_FROM: "from@example.com",
      } as NodeJS.ProcessEnv,
      async () => {
        const emailEnv = await loadEmailEnv();
        expect(emailEnv.SMTP_SECURE).toBeUndefined();
      },
    );
  });

  it("rejects non-numeric SMTP_PORT", async () => {
    const errorSpy = spyOnConsoleError();
    const action = withEmailEnv(
      {
        EMAIL_PROVIDER: "smtp",
        SMTP_PORT: "not-a-number",
      } as NodeJS.ProcessEnv,
      async () => loadEmailEnv(),
    );
    await expect(action).rejects.toThrow("Invalid email environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid email environment variables:",
      expect.objectContaining({
        SMTP_PORT: { _errors: [expect.stringContaining("must be a number")] },
      }),
    );
    errorSpy.mockRestore();
  });

  it("rejects invalid SMTP_SECURE value", async () => {
    const errorSpy = spyOnConsoleError();
    const action = withEmailEnv(
      {
        EMAIL_PROVIDER: "smtp",
        SMTP_SECURE: "notabool",
      } as NodeJS.ProcessEnv,
      async () => loadEmailEnv(),
    );
    await expect(action).rejects.toThrow("Invalid email environment variables");
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

  it("logs and throws for malformed SMTP_URL", async () => {
    const errorSpy = spyOnConsoleError();
    const action = withEmailEnv(
      {
        SMTP_URL: "not-a-url",
      } as NodeJS.ProcessEnv,
      async () => loadEmailEnv(),
    );
    await expect(action).rejects.toThrow("Invalid email environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid email environment variables:",
      expect.objectContaining({
        SMTP_URL: { _errors: [expect.stringContaining("Invalid url")] },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws when SMTP_URL is invalid even if EMAIL_BATCH_SIZE is numeric", async () => {
    const errorSpy = spyOnConsoleError();
    const action = withEmailEnv(
      {
        SMTP_URL: "not-a-url",
        EMAIL_BATCH_SIZE: "5",
      } as NodeJS.ProcessEnv,
      async () => loadEmailEnv(),
    );
    await expect(action).rejects.toThrow("Invalid email environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid email environment variables:",
      expect.objectContaining({
        SMTP_URL: { _errors: [expect.stringContaining("Invalid url")] },
      }),
    );
    errorSpy.mockRestore();
  });

  it("normalizes CAMPAIGN_FROM to lowercase", async () => {
    await withEmailEnv(
      {
        EMAIL_PROVIDER: "smtp",
        SMTP_URL: "smtp://smtp.example.com",
        SMTP_PORT: "587",
        CAMPAIGN_FROM: " Sender@Example.COM ",
      } as NodeJS.ProcessEnv,
      async () => {
        const emailEnv = await loadEmailEnv();
        expect(emailEnv.CAMPAIGN_FROM).toBe("sender@example.com");
      },
    );
  });

  it("throws for invalid CAMPAIGN_FROM", async () => {
    const errorSpy = spyOnConsoleError();
    const action = withEmailEnv(
      {
        EMAIL_PROVIDER: "smtp",
        SMTP_URL: "smtp://smtp.example.com",
        SMTP_PORT: "587",
        CAMPAIGN_FROM: "not-an-email",
      } as NodeJS.ProcessEnv,
      async () => loadEmailEnv(),
    );
    await expect(action).rejects.toThrow("Invalid email environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid email environment variables:",
      expect.objectContaining({
        CAMPAIGN_FROM: {
          _errors: [expect.stringContaining("Invalid email")],
        },
      }),
    );
    errorSpy.mockRestore();
  });
});
