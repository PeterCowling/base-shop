describe("ResendProvider sanityCheck", () => {
  const realFetch = global.fetch;

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.dontMock("../../config");
    global.fetch = realFetch;
    delete process.env.CAMPAIGN_FROM;
    delete process.env.RESEND_API_KEY;
  });

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

