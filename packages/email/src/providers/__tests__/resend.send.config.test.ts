describe("ResendProvider send – config edge cases", () => {
  const options = {
    to: "to@example.com",
    subject: "Subject",
    html: "<p>HTML</p>",
    text: "Text",
  };

  const realFetch = global.fetch;

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.dontMock("../../config");
    global.fetch = realFetch;
    delete process.env.CAMPAIGN_FROM;
    delete process.env.RESEND_API_KEY;
  });

  it("surfaces getDefaultSender errors", async () => {
    process.env.RESEND_API_KEY = "rs";
    const err = new Error("sender fail");
    jest.doMock("../../config", () => ({
      getDefaultSender: () => {
        throw err;
      },
    }));
    const { send } = require("resend");
    const { ResendProvider } = await import("../resend");
    const provider = new ResendProvider();
    await expect(provider.send(options)).rejects.toThrow("sender fail");
    expect(send).not.toHaveBeenCalled();
  });

  it("warns and skips send when API key missing", async () => {
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    const { send } = require("resend");
    const warn = jest
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);

    const { ResendProvider } = await import("../resend");
    const provider = new ResendProvider();
    await provider.send(options);

    expect(warn).toHaveBeenCalledWith(
      "Resend API key is not configured; skipping email send",
    );
    expect(send).not.toHaveBeenCalled();

    warn.mockRestore();
  });
});

