const { Resend, send } = require("resend");

describe("ResendProvider", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.RESEND_API_KEY;
    delete process.env.CAMPAIGN_FROM;
  });

  it("forwards payload to Resend client", async () => {
    process.env.RESEND_API_KEY = "rs";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const { ResendProvider } = await import("../providers/resend");
    const provider = new ResendProvider();

    await provider.send({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "Text",
    });

    expect(Resend).toHaveBeenCalledWith("rs");
    expect(send).toHaveBeenCalledWith({
      from: "campaign@example.com",
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "Text",
    });
  });

  it("throws when sanity check fails", async () => {
    process.env.RESEND_API_KEY = "rs";
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401 });

    const { ResendProvider } = await import("../providers/resend");
    const provider = new ResendProvider({ sanityCheck: true });

    await expect(provider.ready).rejects.toThrow(
      "Resend credentials rejected with status 401"
    );

    global.fetch = originalFetch;
  });
});
