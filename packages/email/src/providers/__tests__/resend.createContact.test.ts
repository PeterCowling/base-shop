describe("ResendProvider createContact", () => {
  const realFetch = global.fetch;

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.dontMock("../../config");
    global.fetch = realFetch;
    delete process.env.CAMPAIGN_FROM;
    delete process.env.RESEND_API_KEY;
  });

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

