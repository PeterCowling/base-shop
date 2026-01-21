let Resend: any;
let send: any;
const originalFetch = global.fetch;

describe("ResendProvider", () => {
  beforeEach(() => {
    ({ Resend, send } = require("resend"));
  });
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.restoreAllMocks();
    global.fetch = originalFetch;
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
      // text intentionally undefined to ensure empty string is sent
    });

    expect(Resend).toHaveBeenCalledWith("rs");
    expect(send).toHaveBeenCalledWith({
      from: "campaign@example.com",
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "",
    });
  });

  it("resolves when sanity check succeeds", async () => {
    process.env.RESEND_API_KEY = "rs";
    const fetchMock = jest.fn().mockResolvedValue({ ok: true }) as any;
    global.fetch = fetchMock;
    const { ResendProvider } = await import("../providers/resend");
    await expect(
      new ResendProvider({ sanityCheck: true }).ready
    ).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/domains",
      { headers: { Authorization: "Bearer rs" } }
    );
  });

  it("resolves without API key and does not fetch during sanity check", async () => {
    delete process.env.RESEND_API_KEY;
    const fetchMock = jest.fn();
    global.fetch = fetchMock as any;
    const { ResendProvider } = await import("../providers/resend");
    await expect(
      new ResendProvider({ sanityCheck: true }).ready
    ).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects when sanity check fetch fails", async () => {
    process.env.RESEND_API_KEY = "rs";
    const err = new Error("fail");
    global.fetch = jest.fn().mockRejectedValue(err) as any;
    const { ResendProvider } = await import("../providers/resend");
    await expect(
      new ResendProvider({ sanityCheck: true }).ready
    ).rejects.toBe(err);
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

  it("throws ProviderError on non-OK responses", async () => {
    process.env.RESEND_API_KEY = "rs";
    process.env.CAMPAIGN_FROM = "from@example.com";
    const err = { message: "Bad Request", statusCode: 400 };
    send.mockRejectedValueOnce(err);
    const { ResendProvider } = await import("../providers/resend");
    const provider = new ResendProvider();
    const promise = provider.send({
      to: "t@example.com",
      subject: "s",
      html: "<p>h</p>",
      text: "t",
    });
    const { ProviderError } = require("../providers/types");
    await expect(promise).rejects.toBeInstanceOf(ProviderError);
    await expect(promise).rejects.toMatchObject({ retryable: false });
  });

  it("wraps primitive rejections in retryable ProviderError", async () => {
    process.env.RESEND_API_KEY = "rs";
    process.env.CAMPAIGN_FROM = "from@example.com";
    send.mockRejectedValueOnce("fail");
    const { logger } = await import("@acme/lib/logger");
    const errorSpy = jest.fn();
    const originalError = logger.error;
    logger.error = errorSpy as any;
    const { ResendProvider } = await import("../providers/resend");
    const provider = new ResendProvider();
    const promise = provider.send({
      to: "t@example.com",
      subject: "s",
      html: "<p>h</p>",
      text: "t",
    });
    const { ProviderError } = require("../providers/types");
    await expect(promise).rejects.toBeInstanceOf(ProviderError);
    await expect(promise).rejects.toMatchObject({
      message: "Unknown error",
      retryable: true,
    });
    expect(errorSpy).toHaveBeenCalledWith("Campaign email send failed", {
      provider: "resend",
      recipient: "t@example.com",
      campaignId: undefined,
    });
    logger.error = originalError;
  });

  it("wraps object rejections without message in retryable ProviderError", async () => {
    process.env.RESEND_API_KEY = "rs";
    process.env.CAMPAIGN_FROM = "from@example.com";
    send.mockRejectedValueOnce({ statusCode: 500 });
    const { logger } = await import("@acme/lib/logger");
    const errorSpy = jest.fn();
    const originalError = logger.error;
    logger.error = errorSpy as any;
    const { ResendProvider } = await import("../providers/resend");
    const provider = new ResendProvider();
    const promise = provider.send({
      to: "t@example.com",
      subject: "s",
      html: "<p>h</p>",
      text: "t",
    });
    const { ProviderError } = require("../providers/types");
    await expect(promise).rejects.toBeInstanceOf(ProviderError);
    await expect(promise).rejects.toMatchObject({
      message: "Unknown error",
      retryable: true,
    });
    expect(errorSpy).toHaveBeenCalledWith("Campaign email send failed", {
      provider: "resend",
      recipient: "t@example.com",
      campaignId: undefined,
    });
    logger.error = originalError;
  });

  it("logs warning when API key missing", async () => {
    process.env.CAMPAIGN_FROM = "from@example.com";
    const { logger } = await import("@acme/lib/logger");
    const warnSpy = jest.fn();
    const originalWarn = logger.warn;
    logger.warn = warnSpy as any;
    const { ResendProvider } = await import("../providers/resend");
    const provider = new ResendProvider();
    await provider.send({
      to: "t@example.com",
      subject: "s",
      html: "<p>h</p>",
      text: "t",
    });
    expect(warnSpy).toHaveBeenCalledWith(
      "Resend API key is not configured; skipping email send",
      {
        provider: "resend",
        recipient: "t@example.com",
        campaignId: undefined,
      }
    );
    expect(send).not.toHaveBeenCalled();
    logger.warn = originalWarn;
  });

  it("getCampaignStats returns empty stats when API key missing", async () => {
    global.fetch = jest.fn();
    const { ResendProvider } = await import("../providers/resend");
    const { emptyStats } = await import("../stats");
    const provider = new ResendProvider();
    await expect(provider.getCampaignStats("1")).resolves.toEqual(emptyStats);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("getCampaignStats forwards mapped stats", async () => {
    process.env.RESEND_API_KEY = "rs";
    const stats = {
      delivered: "2",
      opened_count: "3",
      clicked: 1,
      unsubscribed_count: "4",
      bounced_count: "5",
    };
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce(stats),
    }) as any;
    const { ResendProvider } = await import("../providers/resend");
    const { mapResendStats } = await import("../stats");
    const provider = new ResendProvider();
    await expect(provider.getCampaignStats("1")).resolves.toEqual(
      mapResendStats(stats),
    );
  });

  it("getCampaignStats returns fallback when json rejects", async () => {
    process.env.RESEND_API_KEY = "rs";
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: jest.fn().mockRejectedValueOnce(new Error("fail")),
    }) as any;
    const { ResendProvider } = await import("../providers/resend");
    const provider = new ResendProvider();
    const { emptyStats } = await import("../stats");
    await expect(provider.getCampaignStats("1")).resolves.toEqual(emptyStats);
  });

  it("getCampaignStats returns fallback when fetch rejects", async () => {
    process.env.RESEND_API_KEY = "rs";
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error("fail")) as any;
    const { ResendProvider } = await import("../providers/resend");
    const provider = new ResendProvider();
    const { emptyStats } = await import("../stats");
    await expect(provider.getCampaignStats("1")).resolves.toEqual(emptyStats);
  });

  it("createContact returns empty string when API key missing", async () => {
    const { ResendProvider } = await import("../providers/resend");
    const provider = new ResendProvider();
    global.fetch = jest.fn();
    await expect(provider.createContact("user@example.com")).resolves.toBe("");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("createContact returns id when fetch succeeds", async () => {
    process.env.RESEND_API_KEY = "rs";
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ id: "123" }),
      }) as any;
    const { ResendProvider } = await import("../providers/resend");
    const provider = new ResendProvider();
    await expect(provider.createContact("user@example.com")).resolves.toBe(
      "123"
    );
  });

  it("createContact returns empty string when json rejects", async () => {
    process.env.RESEND_API_KEY = "rs";
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: jest.fn().mockRejectedValueOnce(new Error("fail")),
    }) as any;
    const { ResendProvider } = await import("../providers/resend");
    const provider = new ResendProvider();
    await expect(provider.createContact("user@example.com")).resolves.toBe("");
  });

  it("createContact returns empty string when fetch rejects", async () => {
    process.env.RESEND_API_KEY = "rs";
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("fail")) as any;
    const { ResendProvider } = await import("../providers/resend");
    const provider = new ResendProvider();
    await expect(provider.createContact("user@example.com")).resolves.toBe("");
  });

  it("addToList resolves even when fetch rejects", async () => {
    process.env.RESEND_API_KEY = "rs";
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new Error("fail")) as any;
    global.fetch = fetchMock;
    const { ResendProvider } = await import("../providers/resend");
    const provider = new ResendProvider();
    await expect(provider.addToList("cid", "lid")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/segments/lid/contacts",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("addToList posts correct payload", async () => {
    process.env.RESEND_API_KEY = "rs";
    const fetchMock = jest.fn().mockResolvedValue({}) as any;
    global.fetch = fetchMock;
    const { ResendProvider } = await import("../providers/resend");
    const provider = new ResendProvider();
    await provider.addToList("cid", "lid");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/segments/lid/contacts",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer rs",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contact_id: "cid" }),
      }
    );
  });

  it("listSegments returns [] when fetch rejects", async () => {
    process.env.RESEND_API_KEY = "rs";
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("fail")) as any;
    const { ResendProvider } = await import("../providers/resend");
    const provider = new ResendProvider();
    await expect(provider.listSegments()).resolves.toEqual([]);
  });

  it("listSegments returns [] when json rejects", async () => {
    process.env.RESEND_API_KEY = "rs";
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: jest.fn().mockRejectedValueOnce(new Error("fail")),
    }) as any;
    const { ResendProvider } = await import("../providers/resend");
    const provider = new ResendProvider();
    await expect(provider.listSegments()).resolves.toEqual([]);
  });

  it("listSegments handles data arrays", async () => {
    process.env.RESEND_API_KEY = "rs";
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: () =>
        Promise.resolve({ data: [{ id: "1", name: "Test" }] }),
    }) as any;
    const { ResendProvider } = await import("../providers/resend");
    const provider = new ResendProvider();
    await expect(provider.listSegments()).resolves.toEqual([
      { id: "1", name: "Test" },
    ]);
  });

  it("listSegments handles segments arrays", async () => {
    process.env.RESEND_API_KEY = "rs";
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: () =>
        Promise.resolve({ segments: [{ id: "1", name: "Test" }] }),
    }) as any;
    const { ResendProvider } = await import("../providers/resend");
    const provider = new ResendProvider();
    await expect(provider.listSegments()).resolves.toEqual([
      { id: "1", name: "Test" },
    ]);
  });
});
