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
    jest.dontMock("../../config");
    global.fetch = realFetch;
    delete process.env.CAMPAIGN_FROM;
    delete process.env.SENDGRID_API_KEY;
    delete process.env.SENDGRID_MARKETING_KEY;
  });

  it("sets API key when provided", async () => {
    process.env.SENDGRID_API_KEY = "key";
    const sgMail = require("@sendgrid/mail").default;
    const { SendgridProvider } = await import("../sendgrid");
    new SendgridProvider();
    expect(sgMail.setApiKey).toHaveBeenCalledWith("key");
  });

  describe("sanityCheck", () => {
    it("resolves when credentials accepted", async () => {
      process.env.SENDGRID_API_KEY = "key";
      global.fetch = jest.fn().mockResolvedValue({ ok: true }) as any;
      const { SendgridProvider } = await import("../sendgrid");
      const provider = new SendgridProvider({ sanityCheck: true });
      await expect(provider.ready).resolves.toBeUndefined();
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.sendgrid.com/v3/user/profile",
        expect.objectContaining({
          headers: { Authorization: "Bearer key" },
        })
      );
    });

    it("rejects when credentials rejected", async () => {
      process.env.SENDGRID_API_KEY = "key";
      global.fetch = jest
        .fn()
        .mockResolvedValue({ ok: false, status: 401 }) as any;
      const { SendgridProvider } = await import("../sendgrid");
      const provider = new SendgridProvider({ sanityCheck: true });
      await expect(provider.ready).rejects.toThrow(
        "Sendgrid credentials rejected with status 401"
      );
    });

    it("resolves immediately when API key missing", async () => {
      const fetchSpy = jest.spyOn(global, "fetch");
      const { SendgridProvider } = await import("../sendgrid");
      const provider = new SendgridProvider({ sanityCheck: true });
      await expect(provider.ready).resolves.toBeUndefined();
      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });

    it("resolves immediately when sanity check disabled", async () => {
      process.env.SENDGRID_API_KEY = "key";
      const fetchSpy = jest.spyOn(global, "fetch");
      const { SendgridProvider } = await import("../sendgrid");
      const provider = new SendgridProvider();
      await expect(provider.ready).resolves.toBeUndefined();
      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });
  });

  it("resolves on success", async () => {
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    const sgMail = require("@sendgrid/mail").default;
    sgMail.send.mockResolvedValueOnce(undefined);
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.send(options)).resolves.toBeUndefined();
  });

  it("warns when API key missing", async () => {
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    const warn = jest
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);
    const sgMail = require("@sendgrid/mail").default;
    sgMail.send.mockResolvedValueOnce(undefined);
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await provider.send(options);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      "Sendgrid API key is not configured; attempting to send email"
    );
    warn.mockRestore();
  });

  it("uses default sender address", async () => {
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    process.env.SENDGRID_API_KEY = "key";
    const sgMail = require("@sendgrid/mail").default;
    sgMail.send.mockResolvedValueOnce(undefined);
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await provider.send(options);
    expect(sgMail.send).toHaveBeenCalledWith(
      expect.objectContaining({ from: "campaign@example.com" })
    );
  });

  it("sends payload matching Sendgrid API schema", async () => {
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    process.env.SENDGRID_API_KEY = "key";
    const sgMail = require("@sendgrid/mail").default;
    sgMail.send.mockResolvedValueOnce(undefined);
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await provider.send(options);
    expect(sgMail.send).toHaveBeenCalledWith({
      to: options.to,
      from: "campaign@example.com",
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  });

  it("surfaces getDefaultSender errors", async () => {
    process.env.SENDGRID_API_KEY = "key";
    const error = new Error("sender fail");
    jest.doMock("../../config", () => ({
      getDefaultSender: () => {
        throw error;
      },
    }));
    const sgMail = require("@sendgrid/mail").default;
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.send(options)).rejects.toThrow("sender fail");
    expect(sgMail.send).not.toHaveBeenCalled();
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

  it("treats standard Error as retryable", async () => {
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    const sgMail = require("@sendgrid/mail").default;
    const err = new Error("network fail");
    sgMail.send.mockRejectedValueOnce(err);
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    const { ProviderError } = require("../types");
    const promise = provider.send(options);
    await expect(promise).rejects.toBeInstanceOf(ProviderError);
    await expect(promise).rejects.toMatchObject({
      message: "network fail",
      retryable: true,
    });
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

  it("parses string status codes", async () => {
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    const sgMail = require("@sendgrid/mail").default;
    const err = Object.assign(new Error("Upstream"), { status: "502" });
    sgMail.send.mockRejectedValueOnce(err);
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    const { ProviderError } = require("../types");
    const promise = provider.send(options);
    await expect(promise).rejects.toBeInstanceOf(ProviderError);
    await expect(promise).rejects.toMatchObject({ retryable: true });
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

    it("returns empty stats on JSON parse failure", async () => {
      process.env.SENDGRID_API_KEY = "key";
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.reject(new Error("bad")),
      }) as any;
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

  describe("createContact", () => {
    it("returns the new contact id on success", async () => {
      process.env.SENDGRID_MARKETING_KEY = "mk";
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ persisted_recipients: ["abc"] }),
      }) as any;
      const { SendgridProvider } = await import("../sendgrid");
      const provider = new SendgridProvider();
      await expect(
        provider.createContact("test@example.com")
      ).resolves.toBe("abc");
    });

    it("returns empty string when id missing", async () => {
      process.env.SENDGRID_MARKETING_KEY = "mk";
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({}),
      }) as any;
      const { SendgridProvider } = await import("../sendgrid");
      const provider = new SendgridProvider();
      await expect(
        provider.createContact("test@example.com")
      ).resolves.toBe("");
    });

    it("returns empty string when fetch rejects", async () => {
      process.env.SENDGRID_MARKETING_KEY = "mk";
      global.fetch = jest.fn().mockRejectedValue(new Error("fail")) as any;
      const { SendgridProvider } = await import("../sendgrid");
      const provider = new SendgridProvider();
      await expect(
        provider.createContact("test@example.com")
      ).resolves.toBe("");
    });

    it("returns empty string on json failure", async () => {
      process.env.SENDGRID_MARKETING_KEY = "mk";
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.reject(new Error("bad")),
      }) as any;
      const { SendgridProvider } = await import("../sendgrid");
      const provider = new SendgridProvider();
      await expect(
        provider.createContact("test@example.com")
      ).resolves.toBe("");
    });

    it("returns empty string without API key", async () => {
      global.fetch = jest.fn();
      const { SendgridProvider } = await import("../sendgrid");
      const provider = new SendgridProvider();
      await expect(
        provider.createContact("test@example.com")
      ).resolves.toBe("");
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("addToList", () => {
    it("adds contact to list when API key present", async () => {
      process.env.SENDGRID_MARKETING_KEY = "mk";
      global.fetch = jest.fn().mockResolvedValue({}) as any;
      const { SendgridProvider } = await import("../sendgrid");
      const provider = new SendgridProvider();
      await expect(provider.addToList("c1", "l1")).resolves.toBeUndefined();
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.sendgrid.com/v3/marketing/lists/l1/contacts",
        expect.objectContaining({ method: "PUT" })
      );
    });

    it("skips when API key missing", async () => {
      global.fetch = jest.fn();
      const { SendgridProvider } = await import("../sendgrid");
      const provider = new SendgridProvider();
      await expect(provider.addToList("c1", "l1")).resolves.toBeUndefined();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("swallows network failures", async () => {
      process.env.SENDGRID_MARKETING_KEY = "mk";
      global.fetch = jest.fn().mockRejectedValue(new Error("fail")) as any;
      const { SendgridProvider } = await import("../sendgrid");
      const provider = new SendgridProvider();
      await expect(provider.addToList("c1", "l1")).resolves.toBeUndefined();
    });
  });

  describe("listSegments", () => {
    it("returns [] without API key", async () => {
      global.fetch = jest.fn();
      const { SendgridProvider } = await import("../sendgrid");
      const provider = new SendgridProvider();
      await expect(provider.listSegments()).resolves.toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("maps API responses", async () => {
      process.env.SENDGRID_MARKETING_KEY = "mk";
      const payload = { result: [{ id: "1", name: "Segment", extra: "x" }] };
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve(payload),
      }) as any;
      const { SendgridProvider } = await import("../sendgrid");
      const provider = new SendgridProvider();
      await expect(provider.listSegments()).resolves.toEqual([
        { id: "1", name: "Segment" },
      ]);
    });

    it("returns [] on errors", async () => {
      process.env.SENDGRID_MARKETING_KEY = "mk";
      global.fetch = jest.fn().mockRejectedValue(new Error("fail")) as any;
      const { SendgridProvider } = await import("../sendgrid");
      const provider = new SendgridProvider();
      await expect(provider.listSegments()).resolves.toEqual([]);
    });
  });
});

