jest.mock("nodemailer", () => ({
  __esModule: true,
  default: { createTransport: jest.fn() },
}));

jest.mock("../providers/sendgrid", () => ({
  SendgridProvider: jest.fn().mockImplementation(() => ({ send: jest.fn() })),
}));

jest.mock("../providers/resend", () => ({
  ResendProvider: jest.fn().mockImplementation(() => ({ send: jest.fn() })),
}));

describe("sendCampaignEmail", () => {
  afterEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
    delete process.env.SMTP_URL;
    delete process.env.CAMPAIGN_FROM;
    delete process.env.EMAIL_PROVIDER;
    delete process.env.SENDGRID_API_KEY;
    delete process.env.RESEND_API_KEY;
  });

  it("uses SMTP_URL and CAMPAIGN_FROM env vars and forwards options", async () => {
    const nodemailer = await import("nodemailer");
    const createTransportMock = nodemailer.default.createTransport as jest.Mock;
    const sendMail = jest.fn().mockResolvedValue(undefined);
    createTransportMock.mockReturnValue({ sendMail });

    process.env.SMTP_URL = "smtp://test";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const { sendCampaignEmail } = await import("../send");
    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "Text body",
    });

    expect(createTransportMock).toHaveBeenCalledWith({ url: "smtp://test" });
    expect(sendMail).toHaveBeenCalledWith({
      from: "campaign@example.com",
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "Text body",
    });
  });

  it("delegates to SendgridProvider when EMAIL_PROVIDER=sendgrid", async () => {
    process.env.EMAIL_PROVIDER = "sendgrid";
    process.env.SENDGRID_API_KEY = "sg";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const send = jest.fn().mockResolvedValue(undefined);
    const { SendgridProvider } = require("../providers/sendgrid");
    (SendgridProvider as jest.Mock).mockImplementation(() => ({ send }));

    const { sendCampaignEmail } = await import("../send");
    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
    });

    expect(SendgridProvider).toHaveBeenCalled();
    expect(send).toHaveBeenCalledWith({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
    });
  });

  it("delegates to ResendProvider when EMAIL_PROVIDER=resend", async () => {
    process.env.EMAIL_PROVIDER = "resend";
    process.env.RESEND_API_KEY = "rs";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const send = jest.fn().mockResolvedValue(undefined);
    const { ResendProvider } = require("../providers/resend");
    (ResendProvider as jest.Mock).mockImplementation(() => ({ send }));

    const { sendCampaignEmail } = await import("../send");
    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
    });

    expect(ResendProvider).toHaveBeenCalled();
    expect(send).toHaveBeenCalledWith({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
    });
  });

  it("logs context when sending fails", async () => {
    const error = new Error("oops");
    const nodemailer = await import("nodemailer");
    const createTransportMock = nodemailer.default.createTransport as jest.Mock;
    const sendMail = jest.fn().mockRejectedValue(error);
    createTransportMock.mockReturnValue({ sendMail });
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    process.env.SMTP_URL = "smtp://test";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const { sendCampaignEmail } = await import("../send");

    await expect(
      sendCampaignEmail({
        to: "to@example.com",
        subject: "Subject",
        html: "<p>HTML</p>",
        campaignId: "camp-1",
      })
    ).rejects.toThrow("oops");

    expect(consoleError).toHaveBeenCalledWith(
      "Failed to send campaign email",
      expect.objectContaining({
        campaignId: "camp-1",
        to: "to@example.com",
        provider: "smtp",
        err: error,
      })
    );

    consoleError.mockRestore();
  });
});
