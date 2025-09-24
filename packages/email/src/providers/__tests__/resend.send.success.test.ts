describe("ResendProvider send – success & payload", () => {
  const options = {
    to: "to@example.com",
    subject: "Subject",
    html: "<p>HTML</p>",
    text: "Text",
  };

  const realFetch = global.fetch;

  function setupEnv() {
    process.env.RESEND_API_KEY = "rs";
    process.env.CAMPAIGN_FROM = "campaign@example.com";
  }

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.dontMock("../../config");
    global.fetch = realFetch;
    delete process.env.CAMPAIGN_FROM;
    delete process.env.RESEND_API_KEY;
  });

  it("resolves on success", async () => {
    setupEnv();
    const { send } = require("resend");
    send.mockResolvedValueOnce(undefined);
    const { ResendProvider } = await import("../resend");
    const provider = new ResendProvider();
    await expect(provider.send(options)).resolves.toBeUndefined();
  });

  it("uses default sender address", async () => {
    setupEnv();
    const { send } = require("resend");
    send.mockResolvedValueOnce(undefined);
    const { ResendProvider } = await import("../resend");
    const provider = new ResendProvider();
    await provider.send(options);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ from: "campaign@example.com" })
    );
  });

  it("sends payload matching Resend API schema", async () => {
    setupEnv();
    const { send } = require("resend");
    send.mockResolvedValueOnce(undefined);
    const { ResendProvider } = await import("../resend");
    const provider = new ResendProvider();
    await provider.send(options);
    expect(send).toHaveBeenCalledWith({
      from: "campaign@example.com",
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  });
});

