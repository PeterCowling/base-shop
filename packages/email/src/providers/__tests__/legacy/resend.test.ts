const mockSend = jest.fn();
const ResendCtor = jest.fn(() => ({ emails: { send: mockSend } }));

jest.mock("resend", () => ({ Resend: ResendCtor }));

describe("ResendProvider", () => {
  const realEnv = process.env;
  const realFetch = global.fetch;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  const options = {
    to: "to@example.com",
    subject: "Subject",
    html: "<p>HTML</p>",
    text: "Text",
  };

  beforeEach(async () => {
    jest.resetModules();
    const { logger } = await import("@acme/shared-utils");
    warnSpy = jest.fn();
    errorSpy = jest.fn();
    logger.warn = warnSpy as any;
    logger.error = errorSpy as any;
    process.env = { ...realEnv };
    global.fetch = realFetch;
    mockSend.mockReset();
    ResendCtor.mockClear();
    delete process.env.RESEND_API_KEY;
  });

  afterAll(() => {
    process.env = realEnv;
    global.fetch = realFetch;
    warnSpy?.mockRestore();
    errorSpy?.mockRestore();
  });

  it("sanityCheck resolves when credentials valid", async () => {
    process.env.RESEND_API_KEY = "rs";
    global.fetch = jest.fn().mockResolvedValue({ ok: true }) as any;
    const { ResendProvider } = await import("../../resend");
    const provider = new ResendProvider({ sanityCheck: true });
    await expect(provider.ready).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith("https://api.resend.com/domains", {
      headers: { Authorization: "Bearer rs" },
    });
    expect(ResendCtor).toHaveBeenCalledWith("rs");
  });

  it("sanityCheck rejects on authentication failure", async () => {
    process.env.RESEND_API_KEY = "rs";
    global.fetch = jest
      .fn()
      .mockResolvedValue({ ok: false, status: 401 }) as any;
    const { ResendProvider } = await import("../../resend");
    const provider = new ResendProvider({ sanityCheck: true });
    await expect(provider.ready).rejects.toThrow(
      "Resend credentials rejected with status 401"
    );
  });

  it("send exits early when RESEND_API_KEY missing", async () => {
    const { ResendProvider } = await import("../../resend");
    const provider = new ResendProvider();
    await expect(provider.send(options)).resolves.toBeUndefined();
    expect(mockSend).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      "Resend API key is not configured; skipping email send",
      {
        provider: "resend",
        recipient: options.to,
        campaignId: undefined,
      }
    );
  });

  it("wraps non-retryable ResendError", async () => {
    process.env.RESEND_API_KEY = "rs";
    const err = new Error("Bad") as any;
    err.statusCode = 400;
    mockSend.mockRejectedValueOnce(err);
    process.env.CAMPAIGN_FROM = "from@example.com";
    const { ResendProvider } = await import("../../resend");
    const { ProviderError } = await import("../../types");
    const provider = new ResendProvider();
    const promise = provider.send(options);
    await expect(promise).rejects.toBeInstanceOf(ProviderError);
    await expect(promise).rejects.toThrow("Bad");
    await expect(promise).rejects.toMatchObject({ retryable: false });
  });

  it("wraps retryable ResendError", async () => {
    process.env.RESEND_API_KEY = "rs";
    const err = new Error("Oops") as any;
    err.statusCode = 500;
    mockSend.mockRejectedValueOnce(err);
    process.env.CAMPAIGN_FROM = "from@example.com";
    const { ResendProvider } = await import("../../resend");
    const { ProviderError } = await import("../../types");
    const provider = new ResendProvider();
    const promise = provider.send(options);
    await expect(promise).rejects.toBeInstanceOf(ProviderError);
    await expect(promise).rejects.toThrow("Oops");
    await expect(promise).rejects.toMatchObject({ retryable: true });
  });

  it("wraps unknown errors as retryable", async () => {
    process.env.RESEND_API_KEY = "rs";
    mockSend.mockRejectedValueOnce("boom");
    process.env.CAMPAIGN_FROM = "from@example.com";
    const { ResendProvider } = await import("../../resend");
    const { ProviderError } = await import("../../types");
    const provider = new ResendProvider();
    const promise = provider.send(options);
    await expect(promise).rejects.toBeInstanceOf(ProviderError);
    await expect(promise).rejects.toThrow("Unknown error");
    await expect(promise).rejects.toMatchObject({ retryable: true });
  });

  describe("getCampaignStats", () => {
    it("returns mapped stats on success", async () => {
      process.env.RESEND_API_KEY = "rs";
      const stats = { delivered: "1", opened_count: "2", clicked: 3 };
      global.fetch = jest
        .fn()
        .mockResolvedValue({ json: () => Promise.resolve(stats) }) as any;
      const { ResendProvider } = await import("../../resend");
      const provider = new ResendProvider();
      const { mapResendStats } = await import("../../../stats");
      await expect(provider.getCampaignStats("1")).resolves.toEqual(
        mapResendStats(stats)
      );
    });

    it("returns empty stats on network error", async () => {
      process.env.RESEND_API_KEY = "rs";
      global.fetch = jest.fn().mockRejectedValue(new Error("fail")) as any;
      const { ResendProvider } = await import("../../resend");
      const provider = new ResendProvider();
      const { mapResendStats } = await import("../../../stats");
      await expect(provider.getCampaignStats("1")).resolves.toEqual(
        mapResendStats({})
      );
    });
  });

  describe("createContact", () => {
    it("returns id on success", async () => {
      process.env.RESEND_API_KEY = "rs";
      global.fetch = jest
        .fn()
        .mockResolvedValue({ json: () => Promise.resolve({ id: "abc" }) }) as any;
      const { ResendProvider } = await import("../../resend");
      const provider = new ResendProvider();
      await expect(provider.createContact("test@example.com")).resolves.toBe(
        "abc"
      );
    });

    it("returns empty string on network error", async () => {
      process.env.RESEND_API_KEY = "rs";
      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error("fail")) as any;
      const { ResendProvider } = await import("../../resend");
      const provider = new ResendProvider();
      await expect(provider.createContact("test@example.com")).resolves.toBe(
        ""
      );
    });

    it("returns empty string when id missing", async () => {
      process.env.RESEND_API_KEY = "rs";
      global.fetch = jest
        .fn()
        .mockResolvedValue({ json: () => Promise.resolve({}) }) as any;
      const { ResendProvider } = await import("../../resend");
      const provider = new ResendProvider();
      await expect(provider.createContact("test@example.com")).resolves.toBe(
        ""
      );
    });
  });

  describe("listSegments", () => {
    it("returns segments from data property", async () => {
      process.env.RESEND_API_KEY = "rs";
      const segments = [{ id: "1", name: "A" }];
      global.fetch = jest
        .fn()
        .mockResolvedValue({ json: () => Promise.resolve({ data: segments }) }) as any;
      const { ResendProvider } = await import("../../resend");
      const provider = new ResendProvider();
      await expect(provider.listSegments()).resolves.toEqual(segments);
    });

    it("returns segments from segments property", async () => {
      process.env.RESEND_API_KEY = "rs";
      const segments = [{ id: "1", name: "B" }];
      global.fetch = jest
        .fn()
        .mockResolvedValue(
          { json: () => Promise.resolve({ segments }) }
        ) as any;
      const { ResendProvider } = await import("../../resend");
      const provider = new ResendProvider();
      await expect(provider.listSegments()).resolves.toEqual(segments);
    });

    it("returns empty array on network error", async () => {
      process.env.RESEND_API_KEY = "rs";
      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error("fail")) as any;
      const { ResendProvider } = await import("../../resend");
      const provider = new ResendProvider();
      await expect(provider.listSegments()).resolves.toEqual([]);
    });
  });
});
