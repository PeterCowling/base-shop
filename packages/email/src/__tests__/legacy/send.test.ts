import { ProviderError } from "../../providers/types";

let mockSendgridSend: jest.Mock;
let mockResendSend: jest.Mock;
let mockSendMail: jest.Mock;

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(() => ({
      sendMail: (...args: any[]) => mockSendMail(...args),
    })),
  },
}));

jest.mock("../../providers/sendgrid", () => ({
  SendgridProvider: jest.fn().mockImplementation(() => ({
    send: (...args: any[]) => mockSendgridSend(...args),
  })),
}));

jest.mock("../../providers/resend", () => ({
  ResendProvider: jest.fn().mockImplementation(() => ({
    send: (...args: any[]) => mockResendSend(...args),
  })),
}));

describe("sendCampaignEmail", () => {
  beforeEach(() => {
    jest.useRealTimers();
    process.env.EMAIL_PROVIDER = "smtp";
  });

  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    jest.clearAllTimers();
    delete process.env.EMAIL_PROVIDER;
    delete process.env.SENDGRID_API_KEY;
    delete process.env.RESEND_API_KEY;
    delete process.env.CAMPAIGN_FROM;
  });

  it("ensureText throws when html absent", async () => {
    mockSendgridSend = jest.fn();
    mockResendSend = jest.fn();
    mockSendMail = jest.fn();

    const { sendCampaignEmail } = await import("../../send");

    await expect(
      sendCampaignEmail({
        to: "to@example.com",
        subject: "Subject",
      })
    ).rejects.toThrow("Missing html content for campaign email");

    expect(mockSendgridSend).not.toHaveBeenCalled();
    expect(mockResendSend).not.toHaveBeenCalled();
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it("throws on unsupported EMAIL_PROVIDER", async () => {
    mockSendgridSend = jest.fn();
    mockResendSend = jest.fn();
    mockSendMail = jest.fn();

    const { sendCampaignEmail } = await import("../../send");

    process.env.EMAIL_PROVIDER = "unknown";

    await expect(
      sendCampaignEmail({
        to: "to@example.com",
        subject: "Subject",
        html: "<p>HTML</p>",
        sanitize: false,
      })
    ).rejects.toThrow(
      'Unsupported EMAIL_PROVIDER "unknown". Available providers: sendgrid, resend, smtp'
    );

    expect(mockSendgridSend).not.toHaveBeenCalled();
    expect(mockResendSend).not.toHaveBeenCalled();
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it("sanitizes HTML removing disallowed tags and attributes", async () => {
    mockSendgridSend = jest.fn().mockResolvedValue(undefined);
    mockResendSend = jest.fn();
    mockSendMail = jest.fn();

    process.env.EMAIL_PROVIDER = "sendgrid";
    process.env.SENDGRID_API_KEY = "sg";

    const { sendCampaignEmail } = await import("../../send");

    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html:
        '<div onclick="evil"><script>alert(1)</script><img src="x" onerror="hack" style="color:red"></div>',
    });

    expect(mockSendgridSend).toHaveBeenCalledTimes(1);
    const sanitized = mockSendgridSend.mock.calls[0][0].html as string;
    expect(sanitized).not.toContain("<script");
    expect(sanitized).not.toContain("onclick");
    expect(sanitized).not.toContain("onerror");
    expect(sanitized).toContain('style="color:red"');
    expect(sanitized).toContain('src="x"');
  });

  it("derives text content when text is missing", async () => {
    mockSendgridSend = jest.fn().mockResolvedValue(undefined);
    mockResendSend = jest.fn();
    mockSendMail = jest.fn();

    process.env.EMAIL_PROVIDER = "sendgrid";
    process.env.SENDGRID_API_KEY = "sg";

    const { sendCampaignEmail } = await import("../../send");

    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>Hello <strong>World</strong></p>",
      sanitize: false,
    });

    expect(mockSendgridSend).toHaveBeenCalledTimes(1);
    const opts = mockSendgridSend.mock.calls[0][0];
    expect(opts.text).toBe("Hello World");
  });

  it("caches provider instances across multiple sends", async () => {
    mockSendgridSend = jest.fn().mockResolvedValue(undefined);
    mockResendSend = jest.fn();
    mockSendMail = jest.fn();

    process.env.EMAIL_PROVIDER = "sendgrid";
    process.env.SENDGRID_API_KEY = "sg";

    const { sendCampaignEmail } = await import("../../send");

    await sendCampaignEmail({
      to: "to@example.com",
      subject: "One",
      html: "<p>HTML</p>",
      sanitize: false,
    });
    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Two",
      html: "<p>HTML</p>",
      sanitize: false,
    });

    const { SendgridProvider } = await import("../../providers/sendgrid");
    expect(SendgridProvider).toHaveBeenCalledTimes(1);
    expect(mockSendgridSend).toHaveBeenCalledTimes(2);
  });

  it("retries failing provider then falls back in order", async () => {
    const timeoutSpy = jest.spyOn(global, "setTimeout");
    mockSendgridSend = jest.fn().mockRejectedValue(new ProviderError("fail", true));
    mockResendSend = jest.fn().mockResolvedValue(undefined);
    mockSendMail = jest.fn();

    process.env.EMAIL_PROVIDER = "sendgrid";
    process.env.SENDGRID_API_KEY = "sg";
    process.env.RESEND_API_KEY = "rs";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const { sendCampaignEmail } = await import("../../send");

    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      sanitize: false,
    });

    expect(mockSendgridSend).toHaveBeenCalledTimes(3);
    expect(timeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), 100);
    expect(timeoutSpy).toHaveBeenNthCalledWith(2, expect.any(Function), 200);
    expect(mockResendSend).toHaveBeenCalledTimes(1);
    expect(mockSendMail).not.toHaveBeenCalled();
    timeoutSpy.mockRestore();
  });

  it("falls back to Nodemailer when no provider available", async () => {
    mockSendgridSend = jest.fn();
    mockResendSend = jest.fn();
    mockSendMail = jest.fn().mockResolvedValue(undefined);

    process.env.EMAIL_PROVIDER = "sendgrid";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const { sendCampaignEmail } = await import("../../send");

    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      sanitize: false,
    });

    expect(mockSendgridSend).not.toHaveBeenCalled();
    expect(mockResendSend).not.toHaveBeenCalled();
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });
});

