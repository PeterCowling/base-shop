describe("ResendProvider addToList", () => {
  const realFetch = global.fetch;

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.dontMock("../../config");
    global.fetch = realFetch;
    delete process.env.CAMPAIGN_FROM;
    delete process.env.RESEND_API_KEY;
  });

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

