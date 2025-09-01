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

  it("addToList resolves even when fetch rejects", async () => {
    process.env.SENDGRID_API_KEY = "key";
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("fail")) as any;
    const { SendgridProvider } = await import("../sendgrid");
    const provider = new SendgridProvider();
    await expect(provider.addToList("cid", "lid")).resolves.toBeUndefined();
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
});

