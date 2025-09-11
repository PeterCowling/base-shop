describe("SendgridProvider additional cases", () => {
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
    delete process.env.SENDGRID_API_KEY;
    delete process.env.SENDGRID_MARKETING_KEY;
  });

  it("wraps non-Error sgMail.send rejections", async () => {
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    process.env.SENDGRID_API_KEY = "key";
    const sgMail = require("@sendgrid/mail").default;
    sgMail.send.mockRejectedValueOnce("boom");
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    const { ProviderError } = require("../types");
    await expect(provider.send(options)).rejects.toBeInstanceOf(ProviderError);
  });

  it("getCampaignStats returns emptyStats on fetch failure", async () => {
    process.env.SENDGRID_API_KEY = "key";
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("fail")) as any;
    const { SendgridProvider } = await import("../sendgrid");
    const { emptyStats } = await import("../../stats");
    const provider = new SendgridProvider();
    await expect(provider.getCampaignStats("1")).resolves.toEqual(emptyStats);
  });

  it("createContact returns empty string when fetch rejects", async () => {
    process.env.SENDGRID_API_KEY = "key";
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("fail")) as any;
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.createContact("user@example.com")).resolves.toBe("");
  });

  it("createContact returns empty string without marketing key", async () => {
    global.fetch = jest.fn();
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.createContact("user@example.com")).resolves.toBe("");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("createContact uses marketing key for Authorization header", async () => {
    process.env.SENDGRID_API_KEY = "key";
    process.env.SENDGRID_MARKETING_KEY = "mkey";
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: () => Promise.resolve({ persisted_recipients: ["id"] }),
    }) as any;
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await provider.createContact("user@example.com");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.sendgrid.com/v3/marketing/contacts",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer mkey",
        }),
      })
    );
  });

  it("createContact falls back to API key when marketing key missing", async () => {
    process.env.SENDGRID_API_KEY = "key";
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: () => Promise.resolve({ persisted_recipients: ["id"] }),
    }) as any;
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await provider.createContact("user@example.com");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.sendgrid.com/v3/marketing/contacts",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer key",
        }),
      })
    );
  });

  it("createContact returns id on success", async () => {
    process.env.SENDGRID_API_KEY = "key";
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: () => Promise.resolve({ persisted_recipients: ["123"] }),
    }) as any;
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(
      provider.createContact("user@example.com")
    ).resolves.toBe("123");
  });

  it("createContact returns empty string on invalid json", async () => {
    process.env.SENDGRID_API_KEY = "key";
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: () => Promise.reject(new Error("bad")),
    }) as any;
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.createContact("user@example.com")).resolves.toBe("");
  });

  it("createContact returns empty string when persisted recipients empty", async () => {
    process.env.SENDGRID_API_KEY = "key";
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: () => Promise.resolve({ persisted_recipients: [] }),
    }) as any;
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.createContact("user@example.com")).resolves.toBe("");
  });

  it("createContact returns empty string when persisted recipients missing", async () => {
    process.env.SENDGRID_API_KEY = "key";
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: () => Promise.resolve({}),
    }) as any;
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.createContact("user@example.com")).resolves.toBe("");
  });

  it("addToList resolves even when fetch rejects", async () => {
    process.env.SENDGRID_API_KEY = "key";
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("fail")) as any;
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.addToList("cid", "lid")).resolves.toBeUndefined();
  });

  it("addToList sends request when key present", async () => {
    process.env.SENDGRID_API_KEY = "key";
    global.fetch = jest.fn().mockResolvedValueOnce({}) as any;
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.addToList("cid", "lid")).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalled();
  });

  it("addToList skips when no key", async () => {
    global.fetch = jest.fn();
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.addToList("cid", "lid")).resolves.toBeUndefined();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("listSegments returns [] when marketing key missing", async () => {
    global.fetch = jest.fn();
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.listSegments()).resolves.toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("listSegments returns [] when fetch rejects", async () => {
    process.env.SENDGRID_API_KEY = "key";
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("fail")) as any;
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.listSegments()).resolves.toEqual([]);
  });

  it("listSegments returns [] when json fails", async () => {
    process.env.SENDGRID_API_KEY = "key";
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: () => Promise.reject(new Error("bad")),
    }) as any;
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.listSegments()).resolves.toEqual([]);
  });

  it("listSegments maps results on success", async () => {
    process.env.SENDGRID_API_KEY = "key";
    const payload = { result: [{ id: "1", name: "Segment" }] };
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: () => Promise.resolve(payload),
    }) as any;
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.listSegments()).resolves.toEqual([
      { id: "1", name: "Segment" },
    ]);
  });
});

