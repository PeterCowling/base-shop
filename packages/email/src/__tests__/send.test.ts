// Prefix mock variables with `mock` so Jest's hoisted `jest.mock`
// factory functions can safely reference them.
let mockSendgridSend: jest.Mock;
let mockResendSend: jest.Mock;
let mockSendMail: jest.Mock;
let mockSanitizeHtml: jest.Mock;
let mockHasProviderErrorFields: jest.Mock;

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(() => ({
      // Forward calls to the test-controlled mock implementation.
      sendMail: (...args: any[]) => mockSendMail(...args),
    })),
  },
}));

jest.mock("../providers/sendgrid", () => ({
  SendgridProvider: jest.fn().mockImplementation(() => ({
    send: (...args: any[]) => mockSendgridSend(...args),
  })),
}));

jest.mock("../providers/resend", () => ({
  ResendProvider: jest.fn().mockImplementation(() => ({
    send: (...args: any[]) => mockResendSend(...args),
  })),
}));

jest.mock("../providers/error", () => ({
  hasProviderErrorFields: (...args: any[]) =>
    mockHasProviderErrorFields(...args),
}));

jest.mock("sanitize-html", () => {
  const fn: any = (...args: any[]) => mockSanitizeHtml(...args);
  fn.defaults = { allowedTags: [], allowedAttributes: {} };
  return { __esModule: true, default: fn };
});

jest.mock("../scheduler", () => ({}));
jest.mock("@platform-core/analytics", () => ({
  trackEvent: jest.fn(),
}));
// The templates module imports `@acme/email-templates`. Stub the module to
// avoid loading the real package and its dependencies in this test
// environment.
jest.mock("@acme/email-templates", () => ({ marketingEmailTemplates: [] }));

describe("sendCampaignEmail", () => {
  const setupEnv = () => {
    process.env.EMAIL_PROVIDER = "sendgrid";
    process.env.SENDGRID_API_KEY = "sg";
    process.env.RESEND_API_KEY = "rs";
    process.env.CAMPAIGN_FROM = "campaign@example.com";
  };

  beforeEach(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    jest.clearAllTimers();
    delete process.env.EMAIL_PROVIDER;
    delete process.env.SENDGRID_API_KEY;
    delete process.env.SENDGRID_MARKETING_KEY;
    delete process.env.RESEND_API_KEY;
    delete process.env.CAMPAIGN_FROM;
  });

  it("derives text from HTML when missing", async () => {
    mockSendgridSend = jest.fn().mockResolvedValue(undefined);
    mockResendSend = jest.fn();
    mockSendMail = jest.fn();
    mockSanitizeHtml = jest.fn((html: string) => html);

    setupEnv();

    const { sendCampaignEmail } = await import("../send");
    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>Hello <strong>world</strong></p>",
      sanitize: false,
    });

    expect(mockSanitizeHtml).not.toHaveBeenCalled();
    expect(mockSendgridSend).toHaveBeenCalledWith({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>Hello <strong>world</strong></p>",
      text: "Hello world",
    });
  });

  it("forwards provided text without deriving from HTML", async () => {
    mockSendgridSend = jest.fn().mockResolvedValue(undefined);
    mockResendSend = jest.fn();
    mockSendMail = jest.fn();
    mockSanitizeHtml = jest.fn();

    setupEnv();

    const { sendCampaignEmail } = await import("../index");
    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>Hello <strong>world</strong></p>",
      text: "Custom text",
      sanitize: false,
    });

    expect(mockSanitizeHtml).not.toHaveBeenCalled();
    expect(mockSendgridSend).toHaveBeenCalledWith({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>Hello <strong>world</strong></p>",
      text: "Custom text",
    });
  });

  it("does not call Resend when using Sendgrid", async () => {
    mockSendgridSend = jest.fn().mockResolvedValue(undefined);
    mockResendSend = jest.fn();
    mockSendMail = jest.fn();
    mockSanitizeHtml = jest.fn((html: string) => html);

    setupEnv();

    const { sendCampaignEmail } = await import("../send");
    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      sanitize: false,
    });

    expect(mockResendSend).not.toHaveBeenCalled();
  });

    it("sanitizes HTML and derives text", async () => {
      mockSendgridSend = jest.fn().mockResolvedValue(undefined);
      mockResendSend = jest.fn();
      mockSendMail = jest.fn();
      mockSanitizeHtml = jest.fn((html: string) =>
        html.replace(/<script[\s\S]*?<\/script>/gi, "")
      );

      setupEnv();

      const { sendCampaignEmail } = await import("../index");
      await sendCampaignEmail({
        to: "to@example.com",
        subject: "Subject",
        html: "<p>Hello</p><script>alert(1)</script>",
    });

    expect(mockSanitizeHtml).toHaveBeenCalled();
    expect(mockSendgridSend).toHaveBeenCalledWith({
      to: "to@example.com",
        subject: "Subject",
        html: "<p>Hello</p>",
        text: "Hello",
      });
    });

  it("preserves table elements and styles during sanitization", async () => {
    mockSendgridSend = jest.fn().mockResolvedValue(undefined);
    mockResendSend = jest.fn();
    mockSendMail = jest.fn();
    mockSanitizeHtml = jest.fn((html: string) => html);

    setupEnv();

    const { sendCampaignEmail } = await import("../index");
    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: '<table><tr><td style="color:red">x</td></tr></table>',
    });

    expect(mockSanitizeHtml).toHaveBeenCalled();
    const sentHtml = (mockSendgridSend.mock.calls[0][0] as { html: string })
      .html;
    expect(sentHtml).toContain("<table>");
    expect(sentHtml).toContain("<tr>");
    expect(sentHtml).toContain("<td");
    expect(sentHtml).toContain('style="color:red"');
  });

    it("renders templates before sending", async () => {
      mockSendgridSend = jest.fn().mockResolvedValue(undefined);
      mockResendSend = jest.fn();
      mockSendMail = jest.fn();
      mockSanitizeHtml = jest.fn((html: string) => html);

      setupEnv();

      const { registerTemplate, sendCampaignEmail } = await import("../index");
      registerTemplate("welcome", "<p>Hello {{name}}</p>");

      await sendCampaignEmail({
        to: "to@example.com",
        subject: "Subject",
        templateId: "welcome",
        variables: { name: "Alice" },
      });

      expect(mockSendgridSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: "to@example.com",
          subject: "Subject",
          html: "<p>Hello Alice</p>",
          text: "Hello Alice",
        })
      );
    });

    it("falls back to alternate provider when primary fails", async () => {
      const timeoutSpy = jest.spyOn(global, "setTimeout");
      const { ProviderError } = await import("../providers/types");
      mockSendgridSend = jest
        .fn()
        .mockRejectedValue(new ProviderError("fail", false));
      mockResendSend = jest.fn().mockResolvedValue(undefined);
      mockSendMail = jest.fn();
      mockSanitizeHtml = jest.fn((html: string) => html);
      mockHasProviderErrorFields = jest.fn();

      setupEnv();

      const { sendCampaignEmail } = await import("../index");
      await sendCampaignEmail({
        to: "to@example.com",
        subject: "Subject",
        html: "<p>HTML</p>",
      });

      expect(mockSendgridSend).toHaveBeenCalledTimes(1);
      expect(mockResendSend).toHaveBeenCalledTimes(1);
      expect(timeoutSpy).not.toHaveBeenCalled();
      expect(mockSendMail).not.toHaveBeenCalled();
      expect(mockSendgridSend).toHaveBeenCalledWith({
        to: "to@example.com",
        subject: "Subject",
        html: "<p>HTML</p>",
        text: "HTML",
      });
      expect(mockResendSend).toHaveBeenCalledWith({
        to: "to@example.com",
        subject: "Subject",
        html: "<p>HTML</p>",
        text: "HTML",
      });
      timeoutSpy.mockRestore();
    });

    it("falls back to Nodemailer when all providers fail", async () => {
      const { ProviderError } = await import("../providers/types");
      mockSendgridSend = jest
        .fn()
        .mockRejectedValue(new ProviderError("sg fail", false));
      mockResendSend = jest
        .fn()
        .mockRejectedValue(new ProviderError("rs fail", false));
      mockSendMail = jest.fn().mockResolvedValue(undefined);
      mockSanitizeHtml = jest.fn((html: string) => html);
      mockHasProviderErrorFields = jest.fn();

      setupEnv();

      const { sendCampaignEmail } = await import("../index");
      await sendCampaignEmail({
        to: "to@example.com",
        subject: "Subject",
        html: "<p>HTML</p>",
      });

      expect(mockSendgridSend).toHaveBeenCalledTimes(1);
      expect(mockResendSend).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });

    it("propagates Nodemailer error after other providers fail", async () => {
      const { ProviderError } = await import("../providers/types");
      const sgError = new ProviderError("sg fail", false);
      const rsError = new ProviderError("rs fail", false);
      const smtpError = new Error("smtp fail");

      mockSendgridSend = jest.fn().mockRejectedValue(sgError);
      mockResendSend = jest.fn().mockRejectedValue(rsError);
      mockSendMail = jest.fn().mockRejectedValue(smtpError);
      mockSanitizeHtml = jest.fn((html: string) => html);
      mockHasProviderErrorFields = jest.fn();

      setupEnv();

      const { sendCampaignEmail } = await import("../send");

      await expect(
        sendCampaignEmail({
          to: "to@example.com",
          subject: "Subject",
          html: "<p>HTML</p>",
        })
      ).rejects.toBe(smtpError);

      expect(mockSendgridSend).toHaveBeenCalledTimes(1);
      expect(mockResendSend).toHaveBeenCalledTimes(1);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendgridSend.mock.invocationCallOrder[0]).toBeLessThan(
        mockResendSend.mock.invocationCallOrder[0]
      );
      expect(mockResendSend.mock.invocationCallOrder[0]).toBeLessThan(
        mockSendMail.mock.invocationCallOrder[0]
      );
    });

    it("falls back to alternate provider when Nodemailer fails", async () => {
      mockSendMail = jest.fn().mockRejectedValue(new Error("smtp fail"));
      mockSendgridSend = jest.fn().mockResolvedValue(undefined);
      mockResendSend = jest.fn().mockResolvedValue(undefined);
      mockSanitizeHtml = jest.fn((html: string) => html);
      mockHasProviderErrorFields = jest.fn();

      process.env.EMAIL_PROVIDER = "smtp";
      process.env.SENDGRID_API_KEY = "sg";
      process.env.RESEND_API_KEY = "rs";
      process.env.CAMPAIGN_FROM = "campaign@example.com";

      const { sendCampaignEmail } = await import("../send");
      await sendCampaignEmail({
        to: "to@example.com",
        subject: "Subject",
        html: "<p>HTML</p>",
      });

      expect(mockSendMail).toHaveBeenCalledTimes(1);
      expect(mockSendgridSend).toHaveBeenCalledTimes(1);
      expect(
        mockSendMail.mock.invocationCallOrder[0]
      ).toBeLessThan(mockSendgridSend.mock.invocationCallOrder[0]);
      expect(mockResendSend).not.toHaveBeenCalled();
    });

    it("retries with exponential backoff on retryable error", async () => {
      const timeoutSpy = jest.spyOn(global, "setTimeout");
      const { ProviderError } = await import("../providers/types");
      mockSendgridSend = jest
        .fn()
        .mockRejectedValueOnce(new ProviderError("temporary", true))
        .mockRejectedValueOnce(new ProviderError("temporary", true))
        .mockResolvedValueOnce(undefined);
      mockResendSend = jest.fn();
      mockSendMail = jest.fn();
      mockSanitizeHtml = jest.fn((html: string) => html);
      mockHasProviderErrorFields = jest.fn();

      setupEnv();

      const { sendCampaignEmail } = await import("../index");

      const promise = sendCampaignEmail({
        to: "to@example.com",
        subject: "Subject",
        html: "<p>HTML</p>",
      });

      // Await the next macrotask to allow dynamic imports in the email module
      // to resolve before assertions run.
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(mockSendgridSend).toHaveBeenCalledTimes(1);
      expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100);

      await promise;

      expect(mockSendgridSend).toHaveBeenCalledTimes(3);
      expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 200);
      expect(mockResendSend).not.toHaveBeenCalled();
      timeoutSpy.mockRestore();
    });

    it("stops retrying when provider error indicates non-retryable", async () => {
      const timeoutSpy = jest.spyOn(global, "setTimeout");
      mockSendgridSend = jest
        .fn()
        .mockRejectedValueOnce({ message: "x", retryable: false })
        .mockResolvedValueOnce(undefined);
      mockResendSend = jest.fn().mockResolvedValue(undefined);
      mockSendMail = jest.fn();
      mockSanitizeHtml = jest.fn((html: string) => html);
      mockHasProviderErrorFields = jest.fn().mockReturnValue(true);

      setupEnv();

      const { sendCampaignEmail } = await import("../index");
      await sendCampaignEmail({
        to: "to@example.com",
        subject: "Subject",
        html: "<p>HTML</p>",
      });

      expect(mockSendgridSend).toHaveBeenCalledTimes(1);
      expect(mockResendSend).toHaveBeenCalledTimes(1);
      expect(timeoutSpy).not.toHaveBeenCalled();
      timeoutSpy.mockRestore();
    });

    it("retries when provider error lacks retryable property", async () => {
      const timeoutSpy = jest.spyOn(global, "setTimeout");
      mockSendgridSend = jest.fn().mockRejectedValue({ message: "x" });
      mockResendSend = jest.fn().mockResolvedValue(undefined);
      mockSendMail = jest.fn();
      mockSanitizeHtml = jest.fn((html: string) => html);
      mockHasProviderErrorFields = jest.fn().mockReturnValue(true);

      setupEnv();

      const { sendCampaignEmail } = await import("../index");
      await sendCampaignEmail({
        to: "to@example.com",
        subject: "Subject",
        html: "<p>HTML</p>",
      });

      expect(mockSendgridSend).toHaveBeenCalledTimes(3);
      expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100);
      expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 200);
      expect(mockResendSend).toHaveBeenCalledTimes(1);
      timeoutSpy.mockRestore();
    });

    it("retries when error lacks provider fields", async () => {
      const timeoutSpy = jest.spyOn(global, "setTimeout");
      mockSendgridSend = jest.fn().mockRejectedValue({});
      mockResendSend = jest.fn().mockResolvedValue(undefined);
      mockSendMail = jest.fn();
      mockSanitizeHtml = jest.fn((html: string) => html);
      mockHasProviderErrorFields = jest.fn().mockReturnValue(false);

      setupEnv();

      const { sendCampaignEmail } = await import("../index");
      await sendCampaignEmail({
        to: "to@example.com",
        subject: "Subject",
        html: "<p>HTML</p>",
      });

      expect(mockSendgridSend).toHaveBeenCalledTimes(3);
      expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100);
      expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 200);
      expect(mockResendSend).toHaveBeenCalledTimes(1);
      timeoutSpy.mockRestore();
    });

  it("throws when EMAIL_PROVIDER is invalid", async () => {
    const originalProvider = process.env.EMAIL_PROVIDER;
    const { sendCampaignEmail } = await import("../send");
    process.env.EMAIL_PROVIDER = "invalid";
    await expect(
      sendCampaignEmail({
        to: "to@example.com",
        subject: "Subject",
        html: "<p>HTML</p>",
        sanitize: false,
      })
    ).rejects.toThrow(
      'Unsupported EMAIL_PROVIDER "invalid". Available providers: sendgrid, resend, smtp'
    );
    process.env.EMAIL_PROVIDER = originalProvider;
  });

  it("falls back to Nodemailer when no providers are available", async () => {
    mockSendgridSend = jest.fn();
    mockResendSend = jest.fn();
    mockSendMail = jest.fn().mockResolvedValue(undefined);
    mockSanitizeHtml = jest.fn((html: string) => html);
    mockHasProviderErrorFields = jest.fn();

    process.env.EMAIL_PROVIDER = "sendgrid";
    process.env.CAMPAIGN_FROM = "campaign@example.com";

    const { sendCampaignEmail } = await import("../send");
    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
    });

    expect(mockSendgridSend).not.toHaveBeenCalled();
    expect(mockResendSend).not.toHaveBeenCalled();
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });

  it("logs provider, campaign, and recipient on failure", async () => {
    const { ProviderError } = await import("../providers/types");
    mockSendgridSend = jest
      .fn()
      .mockRejectedValue(new ProviderError("fail", false));
    mockResendSend = jest.fn().mockResolvedValue(undefined);
    mockSendMail = jest.fn();
    mockSanitizeHtml = jest.fn((html: string) => html);
    mockHasProviderErrorFields = jest.fn();

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    setupEnv();

    const { sendCampaignEmail } = await import("../index");
    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      campaignId: "camp123",
    });

    expect(consoleSpy.mock.calls).toEqual(
      expect.arrayContaining([
        [
          "Campaign email send failed",
          expect.objectContaining({
            provider: "sendgrid",
            recipient: "to@example.com",
            campaignId: "camp123",
          }),
        ],
      ])
    );

    consoleSpy.mockRestore();
  });
});
