jest.mock("../analytics", () => ({}));

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: { createTransport: jest.fn() },
}));

jest.mock("@sendgrid/mail", () => ({
  __esModule: true,
  default: { setApiKey: jest.fn(), send: jest.fn() },
}));

jest.mock("resend", () => ({
  __esModule: true,
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: jest.fn() } })),
  send: jest.fn(),
}));

describe("sendCampaignEmail", () => {
  afterEach(async () => {
    jest.resetAllMocks();
    jest.resetModules();
    delete process.env.SMTP_URL;
    delete process.env.CAMPAIGN_FROM;
    delete process.env.EMAIL_PROVIDER;
    delete process.env.SENDGRID_API_KEY;
    delete process.env.SENDGRID_MARKETING_KEY;
    delete process.env.RESEND_API_KEY;
    const { clearTemplates } = await import("../templates");
    clearTemplates();
  });

  it("uses SMTP_URL and CAMPAIGN_FROM env vars and derives text from HTML", async () => {
    const nodemailer = require("nodemailer");
    const createTransportMock = nodemailer.default.createTransport as jest.Mock;
    const sendMail = jest.fn().mockResolvedValue(undefined);
    createTransportMock.mockReturnValue({ sendMail });

    process.env.SMTP_URL = "smtp://test";
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    process.env.EMAIL_PROVIDER = "smtp";

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

  it("delegates to SendgridProvider when EMAIL_PROVIDER=sendgrid", async () => {
    process.env.EMAIL_PROVIDER = "sendgrid";
    process.env.SENDGRID_API_KEY = "sg";
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    const nodemailer = require("nodemailer");
    (nodemailer.default.createTransport as jest.Mock).mockReturnValue({ sendMail: jest.fn() });

    const { sendCampaignEmail } = await import("../send");
    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
    });

    const sgMail = require("@sendgrid/mail").default;
    expect(sgMail.setApiKey).toHaveBeenCalledWith("sg");
    expect(sgMail.send).toHaveBeenCalledWith({
      to: "to@example.com",
      from: "campaign@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "HTML",
    });
  });

  it("delegates to ResendProvider when EMAIL_PROVIDER=resend", async () => {
    process.env.EMAIL_PROVIDER = "resend";
    process.env.RESEND_API_KEY = "rs";
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    const nodemailer = require("nodemailer");
    (nodemailer.default.createTransport as jest.Mock).mockReturnValue({ sendMail: jest.fn() });

    const { sendCampaignEmail } = await import("../send");
    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
    });

    const { Resend } = require("resend");
    const send = Resend.mock.results[0].value.emails.send;
    expect(Resend).toHaveBeenCalledWith("rs");
    expect(send).toHaveBeenCalledWith({
      from: "campaign@example.com",
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "HTML",
    });
  });

  it("renders templates before sending", async () => {
    const nodemailer = require("nodemailer");
    const createTransportMock = nodemailer.default.createTransport as jest.Mock;
    const sendMail = jest.fn().mockResolvedValue(undefined);
    createTransportMock.mockReturnValue({ sendMail });
    process.env.SMTP_URL = "smtp://test";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const { registerTemplate } = await import("../templates");
    registerTemplate("welcome", "<p>Hello {{name}}</p>");
    const { sendCampaignEmail } = await import("../send");
    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      templateId: "welcome",
      variables: { name: "Alice" },
    });

    expect(sendMail).toHaveBeenCalledWith({
      from: "campaign@example.com",
      to: "to@example.com",
      subject: "Subject",
      html: "<p>Hello Alice</p>",
      text: "Hello Alice",
    });
  });

  it("calls renderTemplate when templateId is provided", async () => {
    const nodemailer = require("nodemailer");
    const createTransportMock = nodemailer.default.createTransport as jest.Mock;
    const sendMail = jest.fn().mockResolvedValue(undefined);
    createTransportMock.mockReturnValue({ sendMail });
    process.env.SMTP_URL = "smtp://test";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const templates = await import("../templates");
    const renderSpy = jest
      .spyOn(templates, "renderTemplate")
      .mockReturnValue("<p>Hi</p>");

    const { sendCampaignEmail } = await import("../send");
    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      templateId: "welcome",
    });

    expect(renderSpy).toHaveBeenCalledWith("welcome", {});
    expect(sendMail).toHaveBeenCalledWith({
      from: "campaign@example.com",
      to: "to@example.com",
      subject: "Subject",
      html: "<p>Hi</p>",
      text: "Hi",
    });
  });

  it("sanitizes HTML content by default", async () => {
    const nodemailer = require("nodemailer");
    const createTransportMock = nodemailer.default.createTransport as jest.Mock;
    const sendMail = jest.fn().mockResolvedValue(undefined);
    createTransportMock.mockReturnValue({ sendMail });

    process.env.SMTP_URL = "smtp://test";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const { sendCampaignEmail } = await import("../send");
    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: '<p>Hi</p><img src="x" onerror="alert(1)"><script>alert(1)</script>',
    });

    expect(sendMail).toHaveBeenCalledWith({
      from: "campaign@example.com",
      to: "to@example.com",
      subject: "Subject",
      html: '<p>Hi</p><img src="x" />',
      text: "Hi",
    });
  });

  it("allows bypassing sanitization", async () => {
    const nodemailer = require("nodemailer");
    const createTransportMock = nodemailer.default.createTransport as jest.Mock;
    const sendMail = jest.fn().mockResolvedValue(undefined);
    createTransportMock.mockReturnValue({ sendMail });

    process.env.SMTP_URL = "smtp://test";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const { sendCampaignEmail } = await import("../send");
    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: '<img src="x" onerror="alert(1)">',
      sanitize: false,
    });

    expect(sendMail).toHaveBeenCalledWith({
      from: "campaign@example.com",
      to: "to@example.com",
      subject: "Subject",
      html: '<img src="x" onerror="alert(1)">',
      text: '',
    });
  });
});
