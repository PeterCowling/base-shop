describe("ResendProvider listSegments", () => {
  const realFetch = global.fetch;

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.dontMock("../../config");
    global.fetch = realFetch;
    delete process.env.CAMPAIGN_FROM;
    delete process.env.RESEND_API_KEY;
  });

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

