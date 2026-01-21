import { afterEach,describe, expect, it } from "@jest/globals";

import { withEnv } from "../../../config/test/utils/withEnv";

describe("email env", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("requires sendgrid api key when provider is sendgrid", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        { EMAIL_PROVIDER: "sendgrid", EMAIL_FROM: "from@example.com" },
        () => import("@acme/config/env/email"),
      ),
    ).rejects.toThrow("Invalid email environment variables");
    const formatted = errorSpy.mock.calls[0][1];
    expect(formatted.SENDGRID_API_KEY?._errors[0]).toBe("Required");
  });

  it("loads when sendgrid api key provided", async () => {
    const { emailEnv } = await withEnv(
      {
        EMAIL_PROVIDER: "sendgrid",
        EMAIL_FROM: "from@example.com",
        SENDGRID_API_KEY: "key",
      },
      () => import("@acme/config/env/email"),
    );
    expect(emailEnv.EMAIL_PROVIDER).toBe("sendgrid");
  });

  it("requires resend api key when provider is resend", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      withEnv(
        { EMAIL_PROVIDER: "resend", EMAIL_FROM: "from@example.com" },
        () => import("@acme/config/env/email"),
      ),
    ).rejects.toThrow("Invalid email environment variables");
    const formatted = errorSpy.mock.calls[0][1];
    expect(formatted.RESEND_API_KEY?._errors[0]).toBe("Required");
  });

  it("loads when resend api key provided", async () => {
    const { emailEnv } = await withEnv(
      {
        EMAIL_PROVIDER: "resend",
        EMAIL_FROM: "from@example.com",
        RESEND_API_KEY: "key",
      },
      () => import("@acme/config/env/email"),
    );
    expect(emailEnv.EMAIL_PROVIDER).toBe("resend");
  });

  it("loads noop provider without keys", async () => {
    const { emailEnv } = await withEnv(
      { EMAIL_PROVIDER: "noop" },
      () => import("@acme/config/env/email"),
    );
    expect(emailEnv.EMAIL_PROVIDER).toBe("noop");
  });
});

