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

  it("passes API key to Resend constructor", async () => {
    process.env.RESEND_API_KEY = "rs";
    const { Resend } = require("resend");
    const { ResendProvider } = await import("../resend");
    new ResendProvider();
    expect(Resend).toHaveBeenCalledWith("rs");
  });

  describe("sanityCheck", () => {
    it("resolves when credentials accepted", async () => {
      process.env.RESEND_API_KEY = "rs";
      global.fetch = jest.fn().mockResolvedValue({ ok: true }) as any;
      const { ResendProvider } = await import("../resend");
      const provider = new ResendProvider({ sanityCheck: true });
      await expect(provider.ready).resolves.toBeUndefined();
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.resend.com/domains",
        expect.objectContaining({
          headers: { Authorization: "Bearer rs" },
        })
      );
    });

    it("rejects when credentials rejected", async () => {
      process.env.RESEND_API_KEY = "rs";
      global.fetch = jest
        .fn()
        .mockResolvedValue({ ok: false, status: 401 }) as any;
      const { ResendProvider } = await import("../resend");
      const provider = new ResendProvider({ sanityCheck: true });
      await expect(provider.ready).rejects.toThrow(
        "Resend credentials rejected with status 401"
      );
    });

    it("resolves immediately when API key missing", async () => {
      const fetchSpy = jest.spyOn(global, "fetch");
      const { ResendProvider } = await import("../resend");
      const provider = new ResendProvider({ sanityCheck: true });
      await expect(provider.ready).resolves.toBeUndefined();
      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });

    it("resolves immediately when sanity check disabled", async () => {
      process.env.RESEND_API_KEY = "rs";
      const fetchSpy = jest.spyOn(global, "fetch");
      const { ResendProvider } = await import("../resend");
      const provider = new ResendProvider();
      await expect(provider.ready).resolves.toBeUndefined();
      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });
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

    it("returns empty stats on JSON parse failure", async () => {
      process.env.RESEND_API_KEY = "rs";
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockRejectedValue(new Error("bad")),
      }) as any;
      const { ResendProvider } = await import("../resend");
      const provider = new ResendProvider();
      const { mapResendStats } = await import("../../stats");
      await expect(provider.getCampaignStats("1")).resolves.toEqual(
        mapResendStats({}),
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

  describe("createContact", () => {
    it("returns the new contact id on success", async () => {
      process.env.RESEND_API_KEY = "rs";
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({ id: "abc" }),
      }) as any;
      const { ResendProvider } = await import("../resend");
      const provider = new ResendProvider();
      await expect(
        provider.createContact("test@example.com")
      ).resolves.toBe("abc");
    });

    it("returns empty string when id missing", async () => {
      process.env.RESEND_API_KEY = "rs";
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.resolve({}),
      }) as any;
      const { ResendProvider } = await import("../resend");
      const provider = new ResendProvider();
      await expect(
        provider.createContact("test@example.com")
      ).resolves.toBe("");
    });

    it("returns empty string when fetch rejects", async () => {
      process.env.RESEND_API_KEY = "rs";
      global.fetch = jest.fn().mockRejectedValue(new Error("fail")) as any;
      const { ResendProvider } = await import("../resend");
      const provider = new ResendProvider();
      await expect(
        provider.createContact("test@example.com"),
      ).resolves.toBe("");
    });

    it("returns empty string on json failure", async () => {
      process.env.RESEND_API_KEY = "rs";
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.reject(new Error("bad")),
      }) as any;
      const { ResendProvider } = await import("../resend");
      const provider = new ResendProvider();
      await expect(
        provider.createContact("test@example.com"),
      ).resolves.toBe("");
    });

    it("returns empty string without API key", async () => {
      global.fetch = jest.fn();
      const { ResendProvider } = await import("../resend");
      const provider = new ResendProvider();
      await expect(
        provider.createContact("test@example.com"),
      ).resolves.toBe("");
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe("addToList", () => {
    it("adds contact to list when API key present", async () => {
      process.env.RESEND_API_KEY = "rs";
      global.fetch = jest.fn().mockResolvedValue({}) as any;
      const { ResendProvider } = await import("../resend");
      const provider = new ResendProvider();
      await expect(provider.addToList("c1", "l1")).resolves.toBeUndefined();
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.resend.com/segments/l1/contacts",
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("skips when API key missing", async () => {
      global.fetch = jest.fn();
      const { ResendProvider } = await import("../resend");
      const provider = new ResendProvider();
      await expect(provider.addToList("c1", "l1")).resolves.toBeUndefined();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("swallows network failures", async () => {
      process.env.RESEND_API_KEY = "rs";
      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error("fail")) as any;
      const { ResendProvider } = await import("../resend");
      const provider = new ResendProvider();
      await expect(provider.addToList("c1", "l1")).resolves.toBeUndefined();
    });
  });

  describe("listSegments", () => {
    it("returns [] without API key", async () => {
      global.fetch = jest.fn();
      const { ResendProvider } = await import("../resend");
      const provider = new ResendProvider();
      await expect(provider.listSegments()).resolves.toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it.each(["data", "segments"]) (
      "maps API responses from %s", async (key) => {
        process.env.RESEND_API_KEY = "rs";
        const payload: any = {
          [key]: [{ id: "1", name: "Segment", extra: "x" }],
        };
        global.fetch = jest.fn().mockResolvedValue({
          json: () => Promise.resolve(payload),
        }) as any;
        const { ResendProvider } = await import("../resend");
        const provider = new ResendProvider();
        await expect(provider.listSegments()).resolves.toEqual([
          { id: "1", name: "Segment" },
        ]);
      }
    );

    it("returns [] on json failure", async () => {
      process.env.RESEND_API_KEY = "rs";
      global.fetch = jest.fn().mockResolvedValue({
        json: () => Promise.reject(new Error("bad")),
      }) as any;
      const { ResendProvider } = await import("../resend");
      const provider = new ResendProvider();
      await expect(provider.listSegments()).resolves.toEqual([]);
    });

    it("returns [] on errors", async () => {
      process.env.RESEND_API_KEY = "rs";
      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error("fail")) as any;
      const { ResendProvider } = await import("../resend");
      const provider = new ResendProvider();
      await expect(provider.listSegments()).resolves.toEqual([]);
    });
  });
});

