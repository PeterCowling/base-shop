import { expect } from "@jest/globals";

import { withEnv } from "../test/utils/withEnv";

describe("emailEnv", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("throws and logs when SMTP_URL is invalid", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        { EMAIL_FROM: "from@example.com", SMTP_URL: "notaurl" },
        () => import("../src/env/email"),
      ),
    ).rejects.toThrow("Invalid email environment variables");
    expect(spy).toHaveBeenCalled();
  });

  it("parses numeric strings and applies defaults", async () => {
    const { emailEnv } = await withEnv(
      {
        EMAIL_FROM: "from@example.com",
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
          EMAIL_FROM: "from@example.com",
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
      withEnv(
        { EMAIL_PROVIDER: "sendgrid", EMAIL_FROM: "from@example.com" },
        () => import("../src/env/email"),
      ),
    ).rejects.toThrow("Invalid email environment variables");
    expect(spy).toHaveBeenCalled();
  });

  it("throws and logs when RESEND_API_KEY is missing", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        { EMAIL_PROVIDER: "resend", EMAIL_FROM: "from@example.com" },
        () => import("../src/env/email"),
      ),
    ).rejects.toThrow("Invalid email environment variables");
    expect(spy).toHaveBeenCalled();
  });

  it("parses sendgrid config without logging when key is provided", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const { emailEnv } = await withEnv(
      {
        EMAIL_PROVIDER: "sendgrid",
        EMAIL_FROM: "from@example.com",
        SENDGRID_API_KEY: "sendgrid-key",
      },
      () => import("../src/env/email"),
    );
    expect(emailEnv.EMAIL_PROVIDER).toBe("sendgrid");
    expect(emailEnv.SENDGRID_API_KEY).toBe("sendgrid-key");
    expect(spy).not.toHaveBeenCalled();
  });
});
