describe("ResendProvider getCampaignStats", () => {
  const realFetch = global.fetch;

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.dontMock("../../config");
    global.fetch = realFetch;
    delete process.env.CAMPAIGN_FROM;
    delete process.env.RESEND_API_KEY;
  });

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

