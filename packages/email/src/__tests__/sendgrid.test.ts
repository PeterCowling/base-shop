let sgMail: any;
const realFetch = global.fetch;

describe("SendgridProvider", () => {
  beforeEach(() => {
    sgMail = require("@sendgrid/mail").default;
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete process.env.SENDGRID_API_KEY;
    delete process.env.SENDGRID_MARKETING_KEY;
    delete process.env.CAMPAIGN_FROM;
    global.fetch = realFetch;
  });

  it("forwards payload to @sendgrid/mail", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const { SendgridProvider } = await import("../providers/sendgrid");
    const provider = new SendgridProvider();

    await provider.send({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "Text",
    });

    expect(sgMail.setApiKey).toHaveBeenCalledWith("sg");
    expect(sgMail.send).toHaveBeenCalledWith({
      to: "to@example.com",
      from: "campaign@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "Text",
    });
  });

  it("defaults text to empty string", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const { SendgridProvider } = await import("../providers/sendgrid");
    const provider = new SendgridProvider();

    await provider.send({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
    });

    expect(sgMail.send).toHaveBeenCalledWith({
      to: "to@example.com",
      from: "campaign@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "",
    });
  });

  it("warns when API key is missing", async () => {
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    const warn = jest
      .spyOn(console, "warn")
      .mockImplementation(() => undefined);

    sgMail.send.mockResolvedValueOnce(undefined);

    const { SendgridProvider } = await import("../providers/sendgrid");
    const provider = new SendgridProvider();

    await provider.send({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "Text",
    });

    expect(warn).toHaveBeenCalledWith(
      "Sendgrid API key is not configured; attempting to send email",
    );
    expect(sgMail.send).toHaveBeenCalled();

    warn.mockRestore();
  });

  it("throws ProviderError when send fails", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const err: any = new Error("boom");
    err.code = 400;
    sgMail.send.mockRejectedValueOnce(err);

    const { SendgridProvider } = await import("../providers/sendgrid");
    const { ProviderError } = await import("../providers/types");
    const provider = new SendgridProvider();

    const sendPromise = provider.send({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "Text",
    });

    await expect(sendPromise).rejects.toBeInstanceOf(ProviderError);
    await expect(sendPromise).rejects.toMatchObject({
      message: "boom",
      retryable: false,
    });
  });

  it("throws ProviderError with Sendgrid-specific fields", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const err: any = new Error("boom");
    err.response = { statusCode: 500 };
    sgMail.send.mockRejectedValueOnce(err);

    const { SendgridProvider } = await import("../providers/sendgrid");
    const { ProviderError } = await import("../providers/types");
    const provider = new SendgridProvider();

    const sendPromise = provider.send({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
    });

    await expect(sendPromise).rejects.toBeInstanceOf(ProviderError);
    await expect(sendPromise).rejects.toMatchObject({
      message: "boom",
      retryable: true,
    });
  });

  it("throws non-retryable ProviderError when Sendgrid responds with 400", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const err: any = new Error("boom");
    err.response = { statusCode: 400 };
    sgMail.send.mockRejectedValueOnce(err);

    const { SendgridProvider } = await import("../providers/sendgrid");
    const { ProviderError } = await import("../providers/types");
    const provider = new SendgridProvider();

    const sendPromise = provider.send({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
    });

    await expect(sendPromise).rejects.toBeInstanceOf(ProviderError);
    await expect(sendPromise).rejects.toMatchObject({
      message: "boom",
      retryable: false,
    });
  });

  it("throws retryable ProviderError when error lacks provider fields", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const err = new Error("boom");
    sgMail.send.mockRejectedValueOnce(err);

    const { SendgridProvider } = await import("../providers/sendgrid");
    const { ProviderError } = await import("../providers/types");
    const provider = new SendgridProvider();

    const promise = provider.send({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "Text",
    });

    await expect(promise).rejects.toBeInstanceOf(ProviderError);
    await expect(promise).rejects.toMatchObject({
      message: "boom",
      retryable: true,
    });
  });

  it("wraps string rejection in ProviderError", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    sgMail.send.mockRejectedValueOnce("boom");

    const { SendgridProvider } = await import("../providers/sendgrid");
    const { ProviderError } = await import("../providers/types");
    const provider = new SendgridProvider();

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const promise = provider.send({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "Text",
    });

    await expect(promise).rejects.toBeInstanceOf(ProviderError);
    await expect(promise).rejects.toMatchObject({
      message: "Unknown error",
      retryable: true,
    });

    expect(consoleSpy).toHaveBeenCalledWith("Campaign email send failed", {
      provider: "sendgrid",
      recipient: "to@example.com",
      campaignId: undefined,
    });

    consoleSpy.mockRestore();
  });

  it("wraps object rejection without message in ProviderError", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    sgMail.send.mockRejectedValueOnce({ boom: true });

    const { SendgridProvider } = await import("../providers/sendgrid");
    const { ProviderError } = await import("../providers/types");
    const provider = new SendgridProvider();

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    const promise = provider.send({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "Text",
    });

    await expect(promise).rejects.toBeInstanceOf(ProviderError);
    await expect(promise).rejects.toMatchObject({
      message: "Unknown error",
      retryable: true,
    });

    expect(consoleSpy).toHaveBeenCalledWith("Campaign email send failed", {
      provider: "sendgrid",
      recipient: "to@example.com",
      campaignId: undefined,
    });

    consoleSpy.mockRestore();
  });

  it("throws when sanity check fails", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401 });

    const { SendgridProvider } = await import("../providers/sendgrid");
    const provider = new SendgridProvider({ sanityCheck: true });

    await expect(provider.ready).rejects.toThrow(
      "Sendgrid credentials rejected with status 401"
    );

    global.fetch = originalFetch;
  });

  it("resolves ready when sanity check passes", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    global.fetch = jest.fn().mockResolvedValue({ ok: true });

    const { SendgridProvider } = await import("../providers/sendgrid");
    const provider = new SendgridProvider({ sanityCheck: true });

    await expect(provider.ready).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.sendgrid.com/v3/user/profile",
      { headers: { Authorization: "Bearer sg" } }
    );
  });

  it("resolves ready immediately when sanity check disabled", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    const fetchSpy = jest.spyOn(global, "fetch");

    const { SendgridProvider } = await import("../providers/sendgrid");
    const provider = new SendgridProvider();

    await expect(provider.ready).resolves.toBeUndefined();
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  describe("getCampaignStats", () => {
    it("returns normalized stats on success", async () => {
      process.env.SENDGRID_API_KEY = "sg";
      const stats = { delivered: "2", opens: "3", clicks: 1 };
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue(stats),
      });
      const { SendgridProvider } = await import("../providers/sendgrid");
      const { mapSendGridStats } = await import("../stats");
      const provider = new SendgridProvider();
      await expect(provider.getCampaignStats("1")).resolves.toEqual(
        mapSendGridStats(stats),
      );
    });

    it("returns empty stats without api key", async () => {
      global.fetch = jest.fn();
      const { SendgridProvider } = await import("../providers/sendgrid");
      const { emptyStats } = await import("../stats");
      const provider = new SendgridProvider();
      await expect(provider.getCampaignStats("1")).resolves.toEqual(emptyStats);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("returns empty stats on fetch failure", async () => {
      process.env.SENDGRID_API_KEY = "sg";
      global.fetch = jest.fn().mockRejectedValue(new Error("fail"));
      const { SendgridProvider } = await import("../providers/sendgrid");
      const { emptyStats } = await import("../stats");
      const provider = new SendgridProvider();
      await expect(provider.getCampaignStats("1")).resolves.toEqual(emptyStats);
    });

    it("returns empty stats on JSON parse failure", async () => {
      process.env.SENDGRID_API_KEY = "sg";
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockRejectedValue(new Error("bad")),
      });
      const { SendgridProvider } = await import("../providers/sendgrid");
      const { emptyStats } = await import("../stats");
      const provider = new SendgridProvider();
      await expect(provider.getCampaignStats("1")).resolves.toEqual(emptyStats);
    });
  });

  describe("createContact", () => {
    it("returns new contact id on success", async () => {
      process.env.SENDGRID_API_KEY = "sg";
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue({ persisted_recipients: ["abc"] }),
      });
      const { SendgridProvider } = await import("../providers/sendgrid");
      const provider = new SendgridProvider();
      await expect(
        provider.createContact("user@example.com"),
      ).resolves.toBe("abc");
    });

    it("returns empty string without marketing key", async () => {
      global.fetch = jest.fn();
      const { SendgridProvider } = await import("../providers/sendgrid");
      const provider = new SendgridProvider();
      await expect(
        provider.createContact("user@example.com")
      ).resolves.toBe("");
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("returns empty string on fetch failure", async () => {
      process.env.SENDGRID_API_KEY = "sg";
      global.fetch = jest.fn().mockRejectedValue(new Error("fail"));
      const { SendgridProvider } = await import("../providers/sendgrid");
      const provider = new SendgridProvider();
      await expect(
        provider.createContact("user@example.com")
      ).resolves.toBe("");
    });

    it("returns empty string when persisted recipients empty", async () => {
      process.env.SENDGRID_API_KEY = "sg";
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue({ persisted_recipients: [] }),
      });
      const { SendgridProvider } = await import("../providers/sendgrid");
      const provider = new SendgridProvider();
      await expect(
        provider.createContact("user@example.com")
      ).resolves.toBe("");
    });

    it("returns empty string when persisted recipients missing", async () => {
      process.env.SENDGRID_API_KEY = "sg";
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue({}),
      });
      const { SendgridProvider } = await import("../providers/sendgrid");
      const provider = new SendgridProvider();
      await expect(
        provider.createContact("user@example.com")
      ).resolves.toBe("");
    });
  });

  describe("addToList", () => {
    it("adds contact to list on success", async () => {
      process.env.SENDGRID_API_KEY = "sg";
      global.fetch = jest.fn().mockResolvedValue({});
      const { SendgridProvider } = await import("../providers/sendgrid");
      const provider = new SendgridProvider();
      await expect(provider.addToList("cid", "lid")).resolves.toBeUndefined();
      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.sendgrid.com/v3/marketing/lists/lid/contacts",
        expect.objectContaining({ method: "PUT" }),
      );
    });

    it("does nothing without marketing key", async () => {
      global.fetch = jest.fn();
      const { SendgridProvider } = await import("../providers/sendgrid");
      const provider = new SendgridProvider();
      await expect(provider.addToList("cid", "lid")).resolves.toBeUndefined();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("resolves even when fetch fails", async () => {
      process.env.SENDGRID_API_KEY = "sg";
      global.fetch = jest.fn().mockRejectedValue(new Error("fail"));
      const { SendgridProvider } = await import("../providers/sendgrid");
      const provider = new SendgridProvider();
      await expect(provider.addToList("cid", "lid")).resolves.toBeUndefined();
    });
  });

  describe("listSegments", () => {
    it("maps segments on success", async () => {
      process.env.SENDGRID_API_KEY = "sg";
      global.fetch = jest.fn().mockResolvedValue({
        json: jest
          .fn()
          .mockResolvedValue({ result: [{ id: "1", name: "Segment", extra: "x" }] }),
      });
      const { SendgridProvider } = await import("../providers/sendgrid");
      const provider = new SendgridProvider();
      await expect(provider.listSegments()).resolves.toEqual([
        { id: "1", name: "Segment" },
      ]);
    });

    it("returns empty array without marketing key", async () => {
      global.fetch = jest.fn();
      const { SendgridProvider } = await import("../providers/sendgrid");
      const provider = new SendgridProvider();
      await expect(provider.listSegments()).resolves.toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("returns empty array on fetch failure", async () => {
      process.env.SENDGRID_API_KEY = "sg";
      global.fetch = jest.fn().mockRejectedValue(new Error("fail"));
      const { SendgridProvider } = await import("../providers/sendgrid");
      const provider = new SendgridProvider();
      await expect(provider.listSegments()).resolves.toEqual([]);
    });
  });
});
