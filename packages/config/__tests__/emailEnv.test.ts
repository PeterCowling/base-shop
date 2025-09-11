import { expect } from "@jest/globals";
import { withEnv } from "../test/utils/withEnv";

describe("emailEnv", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("throws and logs when SMTP_URL is invalid", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv({ SMTP_URL: "notaurl" }, () => import("../src/env/email")),
    ).rejects.toThrow("Invalid email environment variables");
    expect(spy).toHaveBeenCalled();
  });

  it("parses numeric strings and applies defaults", async () => {
    const { emailEnv } = await withEnv(
      {
        GMAIL_USER: "a",
        SMTP_URL: "https://smtp",
        EMAIL_BATCH_SIZE: "10",
      },
      () => import("../src/env/email"),
    );
    expect(emailEnv.GMAIL_USER).toBe("a");
    expect(emailEnv.SMTP_URL).toBe("https://smtp");
    expect(emailEnv.EMAIL_BATCH_SIZE).toBe(10);
    expect(emailEnv.EMAIL_PROVIDER).toBe("smtp");
  });

  it("throws and logs when EMAIL_BATCH_SIZE is non-numeric", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        {
          GMAIL_USER: "a",
          SMTP_URL: "https://smtp",
          EMAIL_BATCH_SIZE: "abc",
        },
        () => import("../src/env/email"),
      ),
    ).rejects.toThrow("Invalid email environment variables");
    expect(spy).toHaveBeenCalled();
  });

  it("throws and logs when SENDGRID_API_KEY is missing", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv({ EMAIL_PROVIDER: "sendgrid" }, () => import("../src/env/email")),
    ).rejects.toThrow("Invalid email environment variables");
    expect(spy).toHaveBeenCalled();
  });

  it("throws and logs when RESEND_API_KEY is missing", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv({ EMAIL_PROVIDER: "resend" }, () => import("../src/env/email")),
    ).rejects.toThrow("Invalid email environment variables");
    expect(spy).toHaveBeenCalled();
  });

  it("parses sendgrid config without logging when key is provided", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { emailEnv } = await withEnv(
      {
        EMAIL_PROVIDER: "sendgrid",
        SENDGRID_API_KEY: "sendgrid-key",
      },
      () => import("../src/env/email"),
    );
    expect(emailEnv.EMAIL_PROVIDER).toBe("sendgrid");
    expect(emailEnv.SENDGRID_API_KEY).toBe("sendgrid-key");
    expect(spy).not.toHaveBeenCalled();
  });

  it("defaults EMAIL_FROM when provider is noop", async () => {
    const OLD = process.env;
    jest.resetModules();
    process.env = { ...OLD, EMAIL_PROVIDER: "noop" } as NodeJS.ProcessEnv;
    delete process.env.EMAIL_FROM;
    try {
      const { emailEnv } = await import("../src/env/email");
      expect(emailEnv.EMAIL_FROM).toBe("from@example.com");
    } finally {
      process.env = OLD;
    }
  });
});

