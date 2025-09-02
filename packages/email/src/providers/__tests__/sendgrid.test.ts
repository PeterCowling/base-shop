describe("SendgridProvider", () => {
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
    global.fetch = realFetch;
    delete process.env.CAMPAIGN_FROM;
    delete process.env.SENDGRID_API_KEY;
  });

  it("resolves on success", async () => {
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    const sgMail = require("@sendgrid/mail").default;
    sgMail.send.mockResolvedValueOnce(undefined);
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.send(options)).resolves.toBeUndefined();
  });

  it("wraps 400 errors as non-retryable ProviderError", async () => {
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    const sgMail = require("@sendgrid/mail").default;
    const err = Object.assign(new Error("Bad Request"), { code: 400 });
    sgMail.send.mockRejectedValueOnce(err);
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    const { ProviderError } = require("../types");
    const promise = provider.send(options);
    await expect(promise).rejects.toBeInstanceOf(ProviderError);
    await expect(promise).rejects.toMatchObject({
      message: "Bad Request",
      retryable: false,
    });
  });

  it("marks 500 errors as retryable", async () => {
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    const sgMail = require("@sendgrid/mail").default;
    const err = Object.assign(new Error("Server Error"), { code: 500 });
    sgMail.send.mockRejectedValueOnce(err);
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    const { ProviderError } = require("../types");
    const promise = provider.send(options);
    await expect(promise).rejects.toBeInstanceOf(ProviderError);
    await expect(promise).rejects.toMatchObject({ retryable: true });
  });

  it("wraps unexpected errors in ProviderError", async () => {
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    const sgMail = require("@sendgrid/mail").default;
    sgMail.send.mockRejectedValueOnce("boom");
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    const { ProviderError } = require("../types");
    const promise = provider.send(options);
    await expect(promise).rejects.toBeInstanceOf(ProviderError);
    await expect(promise).rejects.toMatchObject({
      message: "Unknown error",
      retryable: true,
    });
  });

  describe("getCampaignStats", () => {
    it("returns normalized stats on success", async () => {
      process.env.SENDGRID_API_KEY = "key";
      const stats = { delivered: "2", opens: "5", clicks: 1 };
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve(stats),
      }) as any;
      const { SendgridProvider } = await import("../sendgrid");
      const provider = new SendgridProvider();
      const { mapSendGridStats } = await import("../../stats");
      await expect(provider.getCampaignStats("1")).resolves.toEqual(
        mapSendGridStats(stats)
      );
    });

    it("returns empty stats when fetch rejects", async () => {
      process.env.SENDGRID_API_KEY = "key";
      global.fetch = jest.fn().mockRejectedValue(new Error("fail")) as any;
      const { SendgridProvider } = await import("../sendgrid");
      const provider = new SendgridProvider();
      const { mapSendGridStats } = await import("../../stats");
      await expect(provider.getCampaignStats("1")).resolves.toEqual(
        mapSendGridStats({})
      );
    });

    it("returns empty stats when SENDGRID_API_KEY missing", async () => {
      global.fetch = jest.fn();
      const { SendgridProvider } = await import("../sendgrid");
      const provider = new SendgridProvider();
      const { mapSendGridStats } = await import("../../stats");
      await expect(provider.getCampaignStats("1")).resolves.toEqual(
        mapSendGridStats({})
      );
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});

