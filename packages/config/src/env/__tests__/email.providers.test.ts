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

describe("email env providers", () => {
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
    await withEmailEnv(env as NodeJS.ProcessEnv, async () => {
      const emailEnv = await loadEmailEnv();
      expect(emailEnv).toMatchObject(expected);
    });
  });

  it("defaults to smtp provider when EMAIL_PROVIDER is omitted", async () => {
    await withEmailEnv(
      {
        NODE_ENV: "production",
      } as NodeJS.ProcessEnv,
      async () => {
        const emailEnv = await loadEmailEnv();
        expect(emailEnv.EMAIL_PROVIDER).toBe("smtp");
      },
    );
  });

  it("defaults to smtp provider in development when EMAIL_PROVIDER is unset", async () => {
    await withEmailEnv(
      {
        NODE_ENV: "development",
      } as NodeJS.ProcessEnv,
      async () => {
        const emailEnv = await loadEmailEnv();
        expect(emailEnv.EMAIL_PROVIDER).toBe("smtp");
      },
    );
  });

  it("throws when SENDGRID_API_KEY is missing for sendgrid provider", async () => {
    const errorSpy = spyOnConsoleError();
    const action = withEmailEnv(
      { EMAIL_PROVIDER: "sendgrid" } as NodeJS.ProcessEnv,
      async () => loadEmailEnv(),
    );
    await expect(action).rejects.toThrow("Invalid email environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid email environment variables:",
      expect.objectContaining({
        SENDGRID_API_KEY: { _errors: [expect.stringContaining("Required")] },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws when RESEND_API_KEY is missing for resend provider", async () => {
    const errorSpy = spyOnConsoleError();
    const action = withEmailEnv(
      { EMAIL_PROVIDER: "resend" } as NodeJS.ProcessEnv,
      async () => loadEmailEnv(),
    );
    await expect(action).rejects.toThrow("Invalid email environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid email environment variables:",
      expect.objectContaining({
        RESEND_API_KEY: { _errors: [expect.stringContaining("Required")] },
      }),
    );
    errorSpy.mockRestore();
  });

  it("throws when SENDGRID_API_KEY is not a string", async () => {
    const errorSpy = spyOnConsoleError();
    const action = withEmailEnv(
      {
        EMAIL_PROVIDER: "sendgrid",
        SENDGRID_API_KEY: 123 as unknown as string,
      } as NodeJS.ProcessEnv,
      async () => loadEmailEnv(),
    );
    await expect(action).rejects.toThrow("Invalid email environment variables");
    expect(errorSpy).toHaveBeenCalledWith(
      "❌ Invalid email environment variables:",
      expect.objectContaining({
        SENDGRID_API_KEY: {
          _errors: [expect.stringContaining("Expected string")],
        },
      }),
    );
    errorSpy.mockRestore();
  });

  it("loads sendgrid provider when key present", async () => {
    const errorSpy = spyOnConsoleError();
    await withEmailEnv(
      { EMAIL_PROVIDER: "sendgrid", SENDGRID_API_KEY: "sg-key" } as NodeJS.ProcessEnv,
      async () => {
        const emailEnv = await loadEmailEnv();
        expect(emailEnv.EMAIL_PROVIDER).toBe("sendgrid");
        expect(emailEnv.SENDGRID_API_KEY).toBe("sg-key");
      },
    );
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("loads resend provider when key present", async () => {
    const errorSpy = spyOnConsoleError();
    await withEmailEnv(
      { EMAIL_PROVIDER: "resend", RESEND_API_KEY: "re-key" } as NodeJS.ProcessEnv,
      async () => {
        const emailEnv = await loadEmailEnv();
        expect(emailEnv.EMAIL_PROVIDER).toBe("resend");
        expect(emailEnv.RESEND_API_KEY).toBe("re-key");
      },
    );
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it.each([
    {
      provider: "smtp",
      env: { EMAIL_PROVIDER: "smtp" },
    },
    {
      provider: "noop",
      env: { EMAIL_PROVIDER: "noop" },
    },
  ])("does not log errors for %s provider without API key", async ({ env }) => {
    const errorSpy = spyOnConsoleError();
    await withEmailEnv(env as NodeJS.ProcessEnv, async () => {
      const emailEnv = await loadEmailEnv();
      expect(emailEnv.EMAIL_PROVIDER).toBe(env.EMAIL_PROVIDER);
    });
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("throws and logs for unsupported EMAIL_PROVIDER", async () => {
    const errorSpy = spyOnConsoleError();
    const action = withEmailEnv(
      {
        EMAIL_PROVIDER: "invalid" as unknown as NodeJS.ProcessEnv[string],
      } as NodeJS.ProcessEnv,
      async () => loadEmailEnv(),
    );
    await expect(action).rejects.toThrow("Invalid email environment variables");
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
});
