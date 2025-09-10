import { ProviderError } from "../src/providers/types";

let mockSendgridSend: jest.Mock;
let mockResendSend: jest.Mock;
let mockSendMail: jest.Mock;
let mockRenderTemplate: jest.Mock;

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(() => ({
      sendMail: (...args: any[]) => mockSendMail(...args),
    })),
  },
}));

jest.mock("../src/providers/sendgrid", () => ({
  SendgridProvider: jest.fn().mockImplementation(() => ({
    send: (...args: any[]) => mockSendgridSend(...args),
  })),
}));

jest.mock("../src/providers/resend", () => ({
  ResendProvider: jest.fn().mockImplementation(() => ({
    send: (...args: any[]) => mockResendSend(...args),
  })),
}));

jest.mock("../src/templates", () => ({
  renderTemplate: (...args: any[]) => mockRenderTemplate(...args),
}));

// Mock storage layer to avoid touching real implementation
jest.mock("../src/storage", () => ({
  setCampaignStore: jest.fn(),
  fsCampaignStore: jest.fn(),
}));

describe("sendCampaignEmail", () => {
  const setupEnv = () => {
    process.env.EMAIL_PROVIDER = "sendgrid";
    process.env.SENDGRID_API_KEY = "sg";
    process.env.RESEND_API_KEY = "rs";
    process.env.CAMPAIGN_FROM = "campaign@example.com";
  };

  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    delete process.env.EMAIL_PROVIDER;
    delete process.env.SENDGRID_API_KEY;
    delete process.env.RESEND_API_KEY;
    delete process.env.CAMPAIGN_FROM;
  });

  it("sends email with configured provider", async () => {
    mockSendgridSend = jest.fn().mockResolvedValue(undefined);
    mockResendSend = jest.fn();
    mockSendMail = jest.fn();

    setupEnv();

    const { sendCampaignEmail } = await import("../src/send");

    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>Hello</p>",
      sanitize: false,
    });

    expect(mockSendgridSend).toHaveBeenCalledWith({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>Hello</p>",
      text: "Hello",
    });
    expect(mockResendSend).not.toHaveBeenCalled();
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it("falls back to next provider on failure", async () => {
    mockSendgridSend = jest
      .fn()
      .mockRejectedValue(new ProviderError("fail", false));
    mockResendSend = jest.fn().mockResolvedValue(undefined);
    mockSendMail = jest.fn();

    setupEnv();

    const { sendCampaignEmail } = await import("../src/send");

    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      sanitize: false,
    });

    expect(mockSendgridSend).toHaveBeenCalled();
    expect(mockResendSend).toHaveBeenCalled();
  });

  it("retries provider on retryable error", async () => {
    const timeoutSpy = jest.spyOn(global, "setTimeout");
    mockSendgridSend = jest
      .fn()
      .mockRejectedValueOnce(new ProviderError("temporary", true))
      .mockRejectedValueOnce(new ProviderError("temporary", true))
      .mockResolvedValueOnce(undefined);
    mockResendSend = jest.fn();
    mockSendMail = jest.fn();

    setupEnv();

    const { sendCampaignEmail } = await import("../src/send");

    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      sanitize: false,
    });

    expect(mockSendgridSend).toHaveBeenCalledTimes(3);
    expect(timeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), 100);
    expect(timeoutSpy).toHaveBeenNthCalledWith(2, expect.any(Function), 200);
    expect(mockResendSend).not.toHaveBeenCalled();
    timeoutSpy.mockRestore();
  });

  it("rejects when html is missing", async () => {
    mockSendgridSend = jest.fn();
    mockResendSend = jest.fn();
    mockSendMail = jest.fn();

    setupEnv();

    const { sendCampaignEmail } = await import("../src/send");

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

  it("sanitizes html by default", async () => {
    mockSendgridSend = jest.fn().mockResolvedValue(undefined);
    mockResendSend = jest.fn();
    mockSendMail = jest.fn();

    setupEnv();

    const { sendCampaignEmail } = await import("../src/send");

    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: '<p>Hello</p><script>alert("x")</script>',
    });

    const calledWith = mockSendgridSend.mock.calls[0][0];
    expect(calledWith.html).toContain("<p>Hello</p>");
    expect(calledWith.html).not.toContain("<script>");
  });

  it("sanitizes html when sanitize is true", async () => {
    mockSendgridSend = jest.fn().mockResolvedValue(undefined);
    mockResendSend = jest.fn();
    mockSendMail = jest.fn();

    setupEnv();

    const { sendCampaignEmail } = await import("../src/send");

    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: '<p>Hello</p><script>alert("x")</script>',
      sanitize: true,
    });

    const calledWith = mockSendgridSend.mock.calls[0][0];
    expect(calledWith.html).toBe("<p>Hello</p>");
  });

  it("does not sanitize html when sanitize is false", async () => {
    mockSendgridSend = jest.fn().mockResolvedValue(undefined);
    mockResendSend = jest.fn();
    mockSendMail = jest.fn();

    setupEnv();

    const { sendCampaignEmail } = await import("../src/send");

    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: '<p>Hello</p><script>alert("x")</script>',
      sanitize: false,
    });

    const calledWith = mockSendgridSend.mock.calls[0][0];
    expect(calledWith.html).toBe('<p>Hello</p><script>alert("x")</script>');
  });

  it("renders template when templateId is provided", async () => {
    mockSendgridSend = jest.fn().mockResolvedValue(undefined);
    mockResendSend = jest.fn();
    mockSendMail = jest.fn();
    mockRenderTemplate = jest.fn(() => "<p>Tpl</p>");

    setupEnv();

    const { sendCampaignEmail } = await import("../src/send");

    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      templateId: "welcome",
      variables: { name: "John" },
      sanitize: false,
    });

    expect(mockRenderTemplate).toHaveBeenCalledWith("welcome", { name: "John" });
    const args = mockSendgridSend.mock.calls[0][0];
    expect(args.html).toBe("<p>Tpl</p>");
    expect(args.text).toBe("Tpl");
  });

  it("falls back to nodemailer when no providers are configured", async () => {
    mockSendgridSend = jest.fn();
    mockResendSend = jest.fn();
    mockSendMail = jest.fn();
    process.env.EMAIL_PROVIDER = "sendgrid";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const { sendCampaignEmail } = await import("../src/send");

    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      sanitize: false,
    });

    expect(mockSendgridSend).not.toHaveBeenCalled();
    expect(mockResendSend).not.toHaveBeenCalled();
    expect(mockSendMail).toHaveBeenCalled();
  });

  it("retries alternate provider on failure", async () => {
    const timeoutSpy = jest.spyOn(global, "setTimeout");
    mockSendgridSend = jest
      .fn()
      .mockRejectedValue(new ProviderError("fail", false));
    mockResendSend = jest
      .fn()
      .mockRejectedValueOnce(new ProviderError("temp", true))
      .mockResolvedValueOnce(undefined);
    mockSendMail = jest.fn();

    setupEnv();

    const { sendCampaignEmail } = await import("../src/send");

    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      sanitize: false,
    });

    expect(mockSendgridSend).toHaveBeenCalledTimes(1);
    expect(mockResendSend).toHaveBeenCalledTimes(2);
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100);
    expect(mockSendMail).not.toHaveBeenCalled();
    timeoutSpy.mockRestore();
  });

  it("throws on unsupported EMAIL_PROVIDER at runtime", async () => {
    mockSendgridSend = jest.fn();
    mockResendSend = jest.fn();
    mockSendMail = jest.fn();

    setupEnv();

    const { sendCampaignEmail } = await import("../src/send");
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

  it("throws on unsupported EMAIL_PROVIDER at import", async () => {
    process.env.EMAIL_PROVIDER = "invalid";
    await expect(import("../src/send")).rejects.toThrow(
      'Unsupported EMAIL_PROVIDER "invalid". Available providers: sendgrid, resend, smtp'
    );
  });
});

