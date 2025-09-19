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

describe("email env batch settings", () => {
  it("parses numeric batch settings", async () => {
    const errorSpy = spyOnConsoleError();
    await withEmailEnv(
      {
        EMAIL_PROVIDER: "sendgrid",
        SENDGRID_API_KEY: "api-key",
        SMTP_URL: "https://smtp.example.com",
        EMAIL_BATCH_SIZE: "10",
        EMAIL_BATCH_DELAY_MS: "20",
      } as NodeJS.ProcessEnv,
      async () => {
        const emailEnv = await loadEmailEnv();
        expect(emailEnv).toMatchObject({
          EMAIL_PROVIDER: "sendgrid",
          SENDGRID_API_KEY: "api-key",
          SMTP_URL: "https://smtp.example.com",
          EMAIL_BATCH_SIZE: 10,
          EMAIL_BATCH_DELAY_MS: 20,
        });
      },
    );
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("allows missing optional batch settings", async () => {
    await withEmailEnv(
      {
        EMAIL_PROVIDER: "sendgrid",
        SENDGRID_API_KEY: "api-key",
      } as NodeJS.ProcessEnv,
      async () => {
        const emailEnv = await loadEmailEnv();
        expect(emailEnv.EMAIL_BATCH_SIZE).toBeUndefined();
        expect(emailEnv.EMAIL_BATCH_DELAY_MS).toBeUndefined();
      },
    );
  });

  it("reports non-numeric EMAIL_BATCH_SIZE", async () => {
    const errorSpy = spyOnConsoleError();
    const action = withEmailEnv(
      {
        EMAIL_BATCH_SIZE: "many",
      } as NodeJS.ProcessEnv,
      async () => loadEmailEnv(),
    );
    await expect(action).rejects.toThrow("Invalid email environment variables");
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

  it("throws and logs formatted error for invalid SMTP_URL and non-numeric EMAIL_BATCH_SIZE", async () => {
    const errorSpy = spyOnConsoleError();
    const action = withEmailEnv(
      {
        SMTP_URL: "not-a-url",
        EMAIL_BATCH_SIZE: "many",
      } as NodeJS.ProcessEnv,
      async () => loadEmailEnv(),
    );
    await expect(action).rejects.toThrow("Invalid email environment variables");
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
  });
});
