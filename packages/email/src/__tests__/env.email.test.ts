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
});

