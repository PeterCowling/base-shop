jest.mock("../providers/sendgrid", () => ({
  SendgridProvider: jest.fn().mockImplementation(() => ({ send: jest.fn() })),
}));

jest.mock("../providers/resend", () => ({
  ResendProvider: jest.fn().mockImplementation(() => ({ send: jest.fn() })),
}));

describe("EMAIL_PROVIDER validation", () => {
  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    delete process.env.EMAIL_PROVIDER;
  });

  it("logs error when EMAIL_PROVIDER is unset", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await import("../send");
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("EMAIL_PROVIDER is not set")
    );
  });

  it("throws when EMAIL_PROVIDER is unsupported", async () => {
    jest.doMock("@acme/config/env/core", () => ({
      coreEnv: { EMAIL_PROVIDER: "mailchimp" },
    }));

    await expect(import("../send")).rejects.toThrow(
      /Unsupported EMAIL_PROVIDER/
    );
  });
});
