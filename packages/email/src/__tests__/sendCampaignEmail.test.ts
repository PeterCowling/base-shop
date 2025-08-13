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

jest.mock("@platform-core/analytics", () => ({
  __esModule: true,
  trackEvent: jest.fn(),
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
    const nodemailer = require("nodemailer");
    const createTransportMock =
      nodemailer.default.createTransport as jest.Mock;
    const sendMail = jest.fn().mockResolvedValue(undefined);
    createTransportMock.mockReturnValue({ sendMail });

    process.env.SMTP_URL = "smtp://test";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const { sendCampaignEmail } = await import("../index");
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
    const send = jest.fn().mockResolvedValue(undefined);
    const { SendgridProvider } = require("../providers/sendgrid");
    (SendgridProvider as jest.Mock).mockImplementation(() => ({ send }));

    process.env.EMAIL_PROVIDER = "sendgrid";
    process.env.SENDGRID_API_KEY = "sg";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const { sendCampaignEmail } = await import("../index");
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
    const send = jest.fn().mockResolvedValue(undefined);
    const { ResendProvider } = require("../providers/resend");
    (ResendProvider as jest.Mock).mockImplementation(() => ({ send }));

    process.env.EMAIL_PROVIDER = "resend";
    process.env.RESEND_API_KEY = "rs";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const { sendCampaignEmail } = await import("../index");
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

  it("renders template before delegating to provider", async () => {
    const send = jest.fn().mockResolvedValue(undefined);
    const { SendgridProvider } = require("../providers/sendgrid");
    (SendgridProvider as jest.Mock).mockImplementation(() => ({ send }));

    process.env.EMAIL_PROVIDER = "sendgrid";
    process.env.SENDGRID_API_KEY = "sg";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const { sendCampaignEmail } = await import("../index");
    await sendCampaignEmail({
      to: "to@example.com",
      templateId: "welcome",
      variables: { name: "Bob" },
    });

    expect(send).toHaveBeenCalledWith({
      to: "to@example.com",
      subject: "Welcome, Bob!",
      html: "<p>Hello Bob, welcome.</p>",
      text: "Hello Bob, welcome.",
    });
  });

  it("renders template before sending", async () => {
    const nodemailer = require("nodemailer");
    const createTransportMock =
      nodemailer.default.createTransport as jest.Mock;
    const sendMail = jest.fn().mockResolvedValue(undefined);
    createTransportMock.mockReturnValue({ sendMail });

    process.env.SMTP_URL = "smtp://test";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const { sendCampaignEmail } = await import("../index");
    await sendCampaignEmail({
      to: "to@example.com",
      templateId: "welcome",
      variables: { name: "Alice" },
    });

    expect(sendMail).toHaveBeenCalledWith({
      from: "campaign@example.com",
      to: "to@example.com",
      subject: "Welcome, Alice!",
      html: "<p>Hello Alice, welcome.</p>",
      text: "Hello Alice, welcome.",
    });
  });
});
