import { describe, it, expect, afterEach } from "@jest/globals";
import { withEnv } from "../../../config/test/utils/withEnv";

describe("email env", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("requires sendgrid api key when provider is sendgrid", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        { EMAIL_PROVIDER: "sendgrid" },
        () => import("@acme/config/src/env/email.ts"),
      ),
    ).rejects.toThrow("Invalid email environment variables");
    const formatted = errorSpy.mock.calls[0][1];
    expect(formatted.SENDGRID_API_KEY?._errors[0]).toBe("Required");
  });

  it("loads when sendgrid api key provided", async () => {
    const { emailEnv } = await withEnv(
      { EMAIL_PROVIDER: "sendgrid", SENDGRID_API_KEY: "key" },
      () => import("@acme/config/src/env/email.ts"),
    );
    expect(emailEnv.EMAIL_PROVIDER).toBe("sendgrid");
  });

  it("requires resend api key when provider is resend", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        { EMAIL_PROVIDER: "resend" },
        () => import("@acme/config/src/env/email.ts"),
      ),
    ).rejects.toThrow("Invalid email environment variables");
    const formatted = errorSpy.mock.calls[0][1];
    expect(formatted.RESEND_API_KEY?._errors[0]).toBe("Required");
  });

  it("loads when resend api key provided", async () => {
    const { emailEnv } = await withEnv(
      { EMAIL_PROVIDER: "resend", RESEND_API_KEY: "key" },
      () => import("@acme/config/src/env/email.ts"),
    );
    expect(emailEnv.EMAIL_PROVIDER).toBe("resend");
  });

  it("loads noop provider without keys", async () => {
    const { emailEnv } = await withEnv(
      { EMAIL_PROVIDER: "noop" },
      () => import("@acme/config/src/env/email.ts"),
    );
    expect(emailEnv.EMAIL_PROVIDER).toBe("noop");
  });

  it("defaults provider to smtp and parses smtp config", async () => {
    const { emailEnv } = await withEnv(
      {
        SMTP_URL: "smtp://mail.example.com",
        SMTP_PORT: "587",
        SMTP_SECURE: "yes",
        CAMPAIGN_FROM: "Sender@Example.COM",
      },
      () => import("@acme/config/src/env/email.ts"),
    );
    expect(emailEnv.EMAIL_PROVIDER).toBe("smtp");
    expect(emailEnv.SMTP_URL).toBe("smtp://mail.example.com");
    expect(emailEnv.SMTP_PORT).toBe(587);
    expect(emailEnv.SMTP_SECURE).toBe(true);
    expect(emailEnv.CAMPAIGN_FROM).toBe("sender@example.com");
  });

  it("throws for invalid smtp port", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        { SMTP_PORT: "abc" },
        () => import("@acme/config/src/env/email.ts"),
      ),
    ).rejects.toThrow("Invalid email environment variables");
    const formatted = errorSpy.mock.calls[0][1];
    expect(formatted.SMTP_PORT?._errors[0]).toBe("must be a number");
  });

  it("throws for invalid smtp secure flag", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        { SMTP_SECURE: "maybe" },
        () => import("@acme/config/src/env/email.ts"),
      ),
    ).rejects.toThrow("Invalid email environment variables");
    const formatted = errorSpy.mock.calls[0][1];
    expect(formatted.SMTP_SECURE?._errors[0]).toBe("must be a boolean");
  });

  it("rejects unsupported provider names", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        { EMAIL_PROVIDER: "mailgun" },
        () => import("@acme/config/src/env/email.ts"),
      ),
    ).rejects.toThrow("Invalid email environment variables");
    const formatted = errorSpy.mock.calls[0][1];
    expect(formatted.EMAIL_PROVIDER?._errors[0]).toContain(
      "Invalid enum value",
    );
  });
});

