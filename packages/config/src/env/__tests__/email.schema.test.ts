/** @jest-environment node */
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { loadEmailEnvSchema, resetEmailEnv } from "./email.test-helpers";

beforeEach(() => {
  resetEmailEnv();
});

afterEach(() => {
  resetEmailEnv();
  jest.clearAllMocks();
});

describe("email env schema", () => {
  it("emits custom issue when SENDGRID_API_KEY is missing for sendgrid provider via safeParse", async () => {
    const schema = await loadEmailEnvSchema();
    const result = schema.safeParse({
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
  });

  it("accepts valid sendgrid configuration via safeParse", async () => {
    const schema = await loadEmailEnvSchema();
    const result = schema.safeParse({
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

  it("emits custom issue when RESEND_API_KEY is missing for resend provider via safeParse", async () => {
    const schema = await loadEmailEnvSchema();
    const result = schema.safeParse({
      EMAIL_PROVIDER: "resend",
      EMAIL_FROM: "from@example.com",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.format()).toEqual(
        expect.objectContaining({
          RESEND_API_KEY: {
            _errors: [expect.stringContaining("Required")],
          },
        }),
      );
    }
  });

  it("accepts valid resend configuration via safeParse", async () => {
    const schema = await loadEmailEnvSchema();
    const result = schema.safeParse({
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

  it("applies default smtp provider via safeParse when EMAIL_PROVIDER is omitted", async () => {
    const schema = await loadEmailEnvSchema();
    const result = schema.safeParse({ EMAIL_FROM: "from@example.com" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.EMAIL_PROVIDER).toBe("smtp");
    }
  });
});
