const sgMail = require("@sendgrid/mail").default;

describe("SendgridProvider", () => {
  const sendOpts = {
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
    delete process.env.SENDGRID_API_KEY;
    delete process.env.SENDGRID_MARKETING_KEY;
    delete process.env.CAMPAIGN_FROM;
  });

  it("forwards payload to @sendgrid/mail", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const { SendgridProvider } = await import("../providers/sendgrid");
    const provider = new SendgridProvider();

    await provider.send(sendOpts);

    expect(sgMail.setApiKey).toHaveBeenCalledWith("sg");
    expect(sgMail.send).toHaveBeenCalledWith({
      ...sendOpts,
      from: "campaign@example.com",
    });
  });

  it("throws ProviderError when sgMail.send fails", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    const error = Object.assign(new Error("boom"), { code: 400 });
    sgMail.send.mockRejectedValueOnce(error);

    const { SendgridProvider } = await import("../providers/sendgrid");
    const { ProviderError } = await import("../providers/types");
    const provider = new SendgridProvider();

    await expect(provider.send(sendOpts)).rejects.toMatchObject({
      name: "ProviderError",
      message: "boom",
      retryable: false,
    });
    await expect(provider.send(sendOpts)).rejects.toBeInstanceOf(ProviderError);
  });

  it("wraps non-Error sgMail.send rejections", async () => {
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    sgMail.send.mockRejectedValueOnce("boom");

    const { SendgridProvider } = await import("../providers/sendgrid");
    const { ProviderError } = await import("../providers/types");
    const provider = new SendgridProvider();

    await expect(provider.send(sendOpts)).rejects.toBeInstanceOf(ProviderError);
  });

  it("ready resolves when sanity check passes", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    const { SendgridProvider } = await import("../providers/sendgrid");
    const provider = new SendgridProvider({ sanityCheck: true });

    await expect(provider.ready).resolves.toBeUndefined();
  });

  it("throws when sanity check fails", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401 });

    const { SendgridProvider } = await import("../providers/sendgrid");
    const provider = new SendgridProvider({ sanityCheck: true });

    await expect(provider.ready).rejects.toThrow(
      "Sendgrid credentials rejected with status 401"
    );
  });

  it("getCampaignStats returns empty stats without API key", async () => {
    const { SendgridProvider } = await import("../providers/sendgrid");
    const { emptyStats } = await import("../stats");
    const provider = new SendgridProvider();

    await expect(provider.getCampaignStats("1")).resolves.toEqual(emptyStats);
  });

  it("getCampaignStats returns empty stats on fetch failure", async () => {
    process.env.SENDGRID_API_KEY = "key";
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("fail")) as any;

    const { SendgridProvider } = await import("../providers/sendgrid");
    const { emptyStats } = await import("../stats");
    const provider = new SendgridProvider();

    await expect(provider.getCampaignStats("1")).resolves.toEqual(emptyStats);
  });

  it("createContact returns empty string without API or marketing key", async () => {
    const { SendgridProvider } = await import("../providers/sendgrid");
    const provider = new SendgridProvider();

    await expect(provider.createContact("user@example.com")).resolves.toBe("");
  });

  it("createContact returns empty string when fetch rejects", async () => {
    process.env.SENDGRID_API_KEY = "key";
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("fail")) as any;

    const { SendgridProvider } = await import("../providers/sendgrid");
    const provider = new SendgridProvider();

    await expect(provider.createContact("user@example.com")).resolves.toBe("");
  });

  it("addToList resolves without API or marketing key", async () => {
    const { SendgridProvider } = await import("../providers/sendgrid");
    const provider = new SendgridProvider();

    await expect(provider.addToList("cid", "lid")).resolves.toBeUndefined();
  });

  it("addToList resolves when fetch rejects", async () => {
    process.env.SENDGRID_API_KEY = "key";
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("fail")) as any;

    const { SendgridProvider } = await import("../providers/sendgrid");
    const provider = new SendgridProvider();

    await expect(provider.addToList("cid", "lid")).resolves.toBeUndefined();
  });

  it("listSegments returns [] without API or marketing key", async () => {
    const { SendgridProvider } = await import("../providers/sendgrid");
    const provider = new SendgridProvider();

    await expect(provider.listSegments()).resolves.toEqual([]);
  });

  it("listSegments returns [] when fetch rejects", async () => {
    process.env.SENDGRID_API_KEY = "key";
    global.fetch = jest.fn().mockRejectedValueOnce(new Error("fail")) as any;

    const { SendgridProvider } = await import("../providers/sendgrid");
    const provider = new SendgridProvider();

    await expect(provider.listSegments()).resolves.toEqual([]);
  });
});
