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

  it("does not log when EMAIL_PROVIDER is unset", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    await import("../send");
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("throws when EMAIL_PROVIDER is unsupported", async () => {
    process.env.EMAIL_PROVIDER = "mailchimp";
    await expect(import("../send")).rejects.toThrow(/Unsupported EMAIL_PROVIDER/);
  });
});
