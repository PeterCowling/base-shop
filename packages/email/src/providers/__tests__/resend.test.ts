describe("ResendProvider", () => {
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
    delete process.env.RESEND_API_KEY;
  });

  function setupEnv() {
    process.env.RESEND_API_KEY = "rs";
    process.env.CAMPAIGN_FROM = "campaign@example.com";
  }

  it("resolves on success", async () => {
    setupEnv();
    const { send } = require("resend");
    send.mockResolvedValueOnce(undefined);
    const { ResendProvider } = await import("../resend");
    const provider = new ResendProvider();
    await expect(provider.send(options)).resolves.toBeUndefined();
  });

  it("wraps 400 errors as non-retryable ProviderError", async () => {
    setupEnv();
    const { send } = require("resend");
    const err = { message: "Bad Request", statusCode: 400 };
    send.mockRejectedValueOnce(err);
    const { ResendProvider } = await import("../resend");
    const provider = new ResendProvider();
    const { ProviderError } = require("../types");
    const promise = provider.send(options);
    await expect(promise).rejects.toBeInstanceOf(ProviderError);
    await expect(promise).rejects.toMatchObject({
      message: "Bad Request",
      retryable: false,
    });
  });

  it("marks 500 errors as retryable", async () => {
    setupEnv();
    const { send } = require("resend");
    const err = { message: "Server Error", statusCode: 500 };
    send.mockRejectedValueOnce(err);
    const { ResendProvider } = await import("../resend");
    const provider = new ResendProvider();
    const { ProviderError } = require("../types");
    const promise = provider.send(options);
    await expect(promise).rejects.toBeInstanceOf(ProviderError);
    await expect(promise).rejects.toMatchObject({ retryable: true });
  });

  it("wraps unexpected errors in ProviderError", async () => {
    setupEnv();
    const { send } = require("resend");
    send.mockRejectedValueOnce("boom");
    const { ResendProvider } = await import("../resend");
    const provider = new ResendProvider();
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
      process.env.RESEND_API_KEY = "rs";
      const stats = { delivered: "1", opened_count: "2", clicked: 3 };
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve(stats),
      }) as any;
      const { ResendProvider } = await import("../resend");
      const provider = new ResendProvider();
      const { mapResendStats } = await import("../../stats");
      await expect(provider.getCampaignStats("1")).resolves.toEqual(
        mapResendStats(stats)
      );
    });

    it("returns empty stats when fetch rejects", async () => {
      process.env.RESEND_API_KEY = "rs";
      global.fetch = jest.fn().mockRejectedValue(new Error("fail")) as any;
      const { ResendProvider } = await import("../resend");
      const provider = new ResendProvider();
      const { mapResendStats } = await import("../../stats");
      await expect(provider.getCampaignStats("1")).resolves.toEqual(
        mapResendStats({})
      );
    });

    it("returns empty stats when RESEND_API_KEY missing", async () => {
      global.fetch = jest.fn();
      const { ResendProvider } = await import("../resend");
      const provider = new ResendProvider();
      const { mapResendStats } = await import("../../stats");
      await expect(provider.getCampaignStats("1")).resolves.toEqual(
        mapResendStats({})
      );
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});

