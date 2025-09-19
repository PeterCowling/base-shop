import { createSendgridTestHarness } from "./setup";

const getSgMail = createSendgridTestHarness();

describe("SendgridProvider send", () => {
  let sgMail: any;

  beforeEach(() => {
    sgMail = getSgMail();
  });

  it("does not set API key when SENDGRID_API_KEY is undefined", async () => {
    const { SendgridProvider } = await import("../../providers/sendgrid");
    new SendgridProvider();

    expect(sgMail.setApiKey).not.toHaveBeenCalled();
  });

  it("forwards payload to @sendgrid/mail", async () => {
    process.env.SENDGRID_API_KEY = "sg";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const { SendgridProvider } = await import("../../providers/sendgrid");
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

    const { SendgridProvider } = await import("../../providers/sendgrid");
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
    const warn = jest.spyOn(console, "warn").mockImplementation(() => undefined);

    sgMail.send.mockResolvedValueOnce(undefined);

    const { SendgridProvider } = await import("../../providers/sendgrid");
    const provider = new SendgridProvider();

    await provider.send({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "Text",
    });

    expect(warn).toHaveBeenCalledWith(
      "Sendgrid API key is not configured; attempting to send email"
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

    const { SendgridProvider } = await import("../../providers/sendgrid");
    const { ProviderError } = await import("../../providers/types");
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

    const { SendgridProvider } = await import("../../providers/sendgrid");
    const { ProviderError } = await import("../../providers/types");
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

    const { SendgridProvider } = await import("../../providers/sendgrid");
    const { ProviderError } = await import("../../providers/types");
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

    const { SendgridProvider } = await import("../../providers/sendgrid");
    const { ProviderError } = await import("../../providers/types");
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

    const { SendgridProvider } = await import("../../providers/sendgrid");
    const { ProviderError } = await import("../../providers/types");
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

    const { SendgridProvider } = await import("../../providers/sendgrid");
    const { ProviderError } = await import("../../providers/types");
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
});
