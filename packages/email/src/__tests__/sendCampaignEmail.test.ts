import nodemailer from "nodemailer";

const sendgridSendMock = jest.fn();
const resendSendMock = jest.fn();

jest.mock("../providers/sendgrid", () => ({
  SendgridProvider: jest.fn().mockImplementation(() => ({ send: sendgridSendMock })),
}));

jest.mock("../providers/resend", () => ({
  ResendProvider: jest.fn().mockImplementation(() => ({ send: resendSendMock })),
}));

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: { createTransport: jest.fn() },
}));

const createTransportMock = nodemailer.createTransport as jest.Mock;

describe("sendCampaignEmail", () => {
  afterEach(() => {
    jest.clearAllMocks();
    delete require.cache[require.resolve("../send")];
    delete require.cache[require.resolve("../providers/sendgrid")];
    delete require.cache[require.resolve("../providers/resend")];
    delete require.cache[require.resolve("@acme/config/env/core")];
    delete process.env.SMTP_URL;
    delete process.env.CAMPAIGN_FROM;
    delete process.env.EMAIL_PROVIDER;
    delete process.env.SENDGRID_API_KEY;
    delete process.env.RESEND_API_KEY;
  });

  it("uses SMTP_URL and CAMPAIGN_FROM env vars and derives text from HTML", async () => {
    const sendMail = jest.fn().mockResolvedValue(undefined);
    createTransportMock.mockReturnValue({ sendMail });

    process.env.SMTP_URL = "smtp://test";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const { sendCampaignEmail } = await import("../send");
    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
    });

    expect(createTransportMock).toHaveBeenCalledWith({ url: "smtp://test" });
    expect(sendMail).toHaveBeenCalledWith({
      from: "campaign@example.com",
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "HTML",
    });
  });

  it.skip("delegates to SendgridProvider when EMAIL_PROVIDER=sendgrid", async () => {
    process.env.EMAIL_PROVIDER = "sendgrid";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const { sendCampaignEmail } = await import("../send");
    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
    });

    expect(sendgridSendMock).toHaveBeenCalledWith({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "HTML",
    });
  });

  it.skip("delegates to ResendProvider when EMAIL_PROVIDER=resend", async () => {
    process.env.EMAIL_PROVIDER = "resend";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const { sendCampaignEmail } = await import("../send");
    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
    });

    expect(resendSendMock).toHaveBeenCalledWith({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "HTML",
    });
  });

  it("sanitizes HTML by default", async () => {
    const sendMail = jest.fn().mockResolvedValue(undefined);
    createTransportMock.mockReturnValue({ sendMail });

    process.env.SMTP_URL = "smtp://test";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const { sendCampaignEmail } = await import("../send");
    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: '<p onclick="alert(1)">Hi<script>alert(1)</script></p>',
    });

    expect(sendMail).toHaveBeenCalledWith({
      from: "campaign@example.com",
      to: "to@example.com",
      subject: "Subject",
      html: "<p>Hi</p>",
      text: "Hi",
    });
  });

  it("can bypass sanitization", async () => {
    const sendMail = jest.fn().mockResolvedValue(undefined);
    createTransportMock.mockReturnValue({ sendMail });

    process.env.SMTP_URL = "smtp://test";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const { sendCampaignEmail } = await import("../send");
    const html = '<p onclick="alert(1)">Hi<script>alert(1)</script></p>';
    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html,
      sanitize: false,
    });

    expect(sendMail).toHaveBeenCalledWith({
      from: "campaign@example.com",
      to: "to@example.com",
      subject: "Subject",
      html,
      text: "Hi",
    });
  });
});
