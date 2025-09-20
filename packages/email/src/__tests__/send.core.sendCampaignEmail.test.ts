// Mock implementations will be configured per-test via the variables below.
let mockRenderTemplate: jest.Mock;
let mockSanitizeHtml: jest.Mock;
let mockHasProviderErrorFields: jest.Mock;
let mockCreateTransport: jest.Mock;
let mockSendMail: jest.Mock;
let mockGetDefaultSender: jest.Mock;

const mockSendgridImport = jest.fn();
const mockResendImport = jest.fn();
const SendgridProvider = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
}));
const ResendProvider = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
}));

jest.mock("../providers/sendgrid", () => {
  mockSendgridImport();
  return { SendgridProvider };
});

jest.mock("../providers/resend", () => {
  mockResendImport();
  return { ResendProvider };
});

jest.mock("../templates", () => ({
  renderTemplate: (...args: any[]) => mockRenderTemplate(...args),
}));

jest.mock("sanitize-html", () => {
  const fn: any = (...args: any[]) => mockSanitizeHtml(...args);
  fn.defaults = { allowedTags: [], allowedAttributes: {} };
  return { __esModule: true, default: fn };
});

jest.mock("../providers/error", () => ({
  hasProviderErrorFields: (...args: any[]) =>
    mockHasProviderErrorFields(...args),
}));

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: {
    createTransport: (...args: any[]) => mockCreateTransport(...args),
  },
}));

jest.mock("../config", () => ({
  getDefaultSender: (...args: any[]) => mockGetDefaultSender(...args),
}));

describe("send core – sendCampaignEmail", () => {
  beforeEach(() => {
    mockRenderTemplate = jest.fn();
    mockSanitizeHtml = jest.fn((html: string) => html);
    mockHasProviderErrorFields = jest.fn().mockReturnValue(true);
    mockSendMail = jest.fn();
    mockCreateTransport = jest.fn(() => ({
      sendMail: (...args: any[]) => mockSendMail(...args),
    }));
    mockGetDefaultSender = jest.fn(() => "from@example.com");
    SendgridProvider.mockClear();
    ResendProvider.mockClear();
    mockSendgridImport.mockClear();
    mockResendImport.mockClear();
    delete process.env.EMAIL_PROVIDER;
    delete process.env.SENDGRID_API_KEY;
    delete process.env.RESEND_API_KEY;
    delete process.env.SMTP_URL;
  });

  it("renders templates when templateId is provided", async () => {
    mockRenderTemplate.mockReturnValue("<p>Rendered</p>");
    const providerSend = jest.fn().mockResolvedValue(undefined);
    SendgridProvider.mockImplementation(() => ({ send: providerSend }));
    await jest.isolateModulesAsync(async () => {
      process.env.EMAIL_PROVIDER = "sendgrid";
      process.env.SENDGRID_API_KEY = "sg";
      const { sendCampaignEmail } = await import("../send");
      await sendCampaignEmail({
        to: "to@example.com",
        subject: "Sub",
        templateId: "welcome",
        variables: { name: "A" },
        sanitize: false,
      });
    });
    expect(mockRenderTemplate).toHaveBeenCalledWith("welcome", { name: "A" });
    expect(providerSend).toHaveBeenCalledWith(
      expect.objectContaining({ html: "<p>Rendered</p>" })
    );
  });

  it("surfaces renderTemplate errors", async () => {
    const err = new Error("render fail");
    mockRenderTemplate.mockImplementation(() => {
      throw err;
    });
    await jest.isolateModulesAsync(async () => {
      process.env.EMAIL_PROVIDER = "sendgrid";
      process.env.SENDGRID_API_KEY = "sg";
      const { sendCampaignEmail } = await import("../send");
      await expect(
        sendCampaignEmail({
          to: "to@example.com",
          subject: "Sub",
          templateId: "welcome",
          sanitize: false,
        })
      ).rejects.toThrow("render fail");
    });
  });

  it("sanitizes HTML when enabled", async () => {
    const providerSend = jest.fn().mockResolvedValue(undefined);
    SendgridProvider.mockImplementation(() => ({ send: providerSend }));
    mockSanitizeHtml.mockImplementation((html: string, opts: any) => {
      expect(opts.allowedTags).toEqual(expect.arrayContaining(["img", "p"]));
      expect(opts.allowedAttributes["*"]).toEqual(
        expect.arrayContaining([
          "href",
          "src",
          "alt",
          "title",
          "width",
          "height",
          "style",
        ])
      );
      return '<p>Hi</p><img src="x" />';
    });
    await jest.isolateModulesAsync(async () => {
      process.env.EMAIL_PROVIDER = "sendgrid";
      process.env.SENDGRID_API_KEY = "sg";
      const { sendCampaignEmail } = await import("../send");
      await sendCampaignEmail({
        to: "t@example.com",
        subject: "s",
        html: '<p>Hi</p><img src="x" onerror="x"><script>bad()</script>',
      });
  });
    expect(mockSanitizeHtml).toHaveBeenCalled();
    expect(providerSend).toHaveBeenCalledWith(
      expect.objectContaining({ html: '<p>Hi</p><img src="x" />' })
    );
  });

  it("removes style attributes during sanitization", async () => {
    const providerSend = jest.fn().mockResolvedValue(undefined);
    SendgridProvider.mockImplementation(() => ({ send: providerSend }));
    mockSanitizeHtml.mockImplementation(() => "<p>Hi</p>");
    await jest.isolateModulesAsync(async () => {
      process.env.EMAIL_PROVIDER = "sendgrid";
      process.env.SENDGRID_API_KEY = "sg";
      const { sendCampaignEmail } = await import("../send");
      await sendCampaignEmail({
        to: "t@example.com",
        subject: "s",
        html: '<p style="color:red">Hi</p>',
      });
    });
    expect(providerSend).toHaveBeenCalledWith(
      expect.objectContaining({ html: "<p>Hi</p>" })
    );
  });

  it("does not sanitize HTML when disabled", async () => {
    const providerSend = jest.fn().mockResolvedValue(undefined);
    SendgridProvider.mockImplementation(() => ({ send: providerSend }));
    let sanitizeSpy: jest.SpyInstance;
    await jest.isolateModulesAsync(async () => {
      const sanitizeModule = await import("sanitize-html");
      sanitizeSpy = jest.spyOn(sanitizeModule, "default");
      process.env.EMAIL_PROVIDER = "sendgrid";
      process.env.SENDGRID_API_KEY = "sg";
      const { sendCampaignEmail } = await import("../send");
      await sendCampaignEmail({
        to: "t@example.com",
        subject: "s",
        html: '<p>Hi</p><img src="x"><script>bad()</script>',
        sanitize: false,
      });
    });
    expect(sanitizeSpy!).not.toHaveBeenCalled();
    expect(providerSend).toHaveBeenCalledWith(
      expect.objectContaining({
        html: '<p>Hi</p><img src="x"><script>bad()</script>',
      })
    );
  });

  it("throws for invalid EMAIL_PROVIDER", async () => {
    await jest.isolateModulesAsync(async () => {
      const { sendCampaignEmail } = await import("../send");
      process.env.EMAIL_PROVIDER = "invalid";
      await expect(
        sendCampaignEmail({
          to: "a@example.com",
          subject: "s",
          html: "<p>h</p>",
          sanitize: false,
        })
      ).rejects.toThrow(
        'Unsupported EMAIL_PROVIDER "invalid". Available providers: sendgrid, resend, smtp'
      );
    });
  });

  it("retries failed provider and eventually sends", async () => {
    jest.useFakeTimers();
    const providerSend = jest
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce(undefined);
    SendgridProvider.mockImplementation(() => ({ send: providerSend }));
    const timeoutSpy = jest.spyOn(global, "setTimeout");
    await jest.isolateModulesAsync(async () => {
      process.env.EMAIL_PROVIDER = "sendgrid";
      process.env.SENDGRID_API_KEY = "sg";
      const { sendCampaignEmail } = await import("../send");
      const promise = sendCampaignEmail({
        to: "t@example.com",
        subject: "s",
        html: "<p>h</p>",
        sanitize: false,
      });
      await jest.runAllTimersAsync();
      await promise;
    });
    expect(providerSend).toHaveBeenCalledTimes(2);
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100);
    timeoutSpy.mockRestore();
    jest.useRealTimers();
  });

  it("falls back to next providers and nodemailer on non-retryable errors", async () => {
    const { ProviderError } = await import("../providers/types");
    const provider1Send = jest
      .fn()
      .mockRejectedValue(new ProviderError("x", false));
    const provider2Send = jest
      .fn()
      .mockRejectedValue(new ProviderError("y", false));
    SendgridProvider.mockImplementation(() => ({ send: provider1Send }));
    ResendProvider.mockImplementation(() => ({ send: provider2Send }));
    await jest.isolateModulesAsync(async () => {
      process.env.SMTP_URL = "smtp://test";
      process.env.EMAIL_PROVIDER = "sendgrid";
      process.env.SENDGRID_API_KEY = "sg";
      process.env.RESEND_API_KEY = "rs";
      const { sendCampaignEmail } = await import("../send");
      await sendCampaignEmail({
        to: "t@example.com",
        subject: "s",
        html: "<p>h</p>",
        sanitize: false,
      });
    });
    expect(provider1Send).toHaveBeenCalledTimes(1);
    expect(provider2Send).toHaveBeenCalledTimes(1);
    expect(mockCreateTransport).toHaveBeenCalledTimes(1);
  });

  it("uses Resend provider when configured", async () => {
    const resendSend = jest.fn().mockResolvedValue(undefined);
    ResendProvider.mockImplementation(() => ({ send: resendSend }));
    await jest.isolateModulesAsync(async () => {
      process.env.EMAIL_PROVIDER = "resend";
      process.env.RESEND_API_KEY = "rs";
      const { sendCampaignEmail } = await import("../send");
      await sendCampaignEmail({
        to: "t@example.com",
        subject: "s",
        html: "<p>h</p>",
        sanitize: false,
      });
    });
    expect(resendSend).toHaveBeenCalledTimes(1);
    expect(SendgridProvider).not.toHaveBeenCalled();
    expect(mockCreateTransport).not.toHaveBeenCalled();
  });

  it("falls back to Sendgrid when Resend key is missing", async () => {
    const sendgridSend = jest.fn().mockResolvedValue(undefined);
    SendgridProvider.mockImplementation(() => ({ send: sendgridSend }));
    await jest.isolateModulesAsync(async () => {
      process.env.EMAIL_PROVIDER = "resend";
      process.env.SENDGRID_API_KEY = "sg";
      const { sendCampaignEmail } = await import("../send");
      await sendCampaignEmail({
        to: "t@example.com",
        subject: "s",
        html: "<p>h</p>",
        sanitize: false,
      });
    });
    expect(sendgridSend).toHaveBeenCalledTimes(1);
    expect(ResendProvider).not.toHaveBeenCalled();
  });

  it("propagates error when all providers fail", async () => {
    const { ProviderError } = await import("../providers/types");
    const providerSend = jest
      .fn()
      .mockRejectedValue(new ProviderError("sg fail", false));
    SendgridProvider.mockImplementation(() => ({ send: providerSend }));
    mockSendMail.mockRejectedValue(new Error("smtp fail"));
    const warnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => {});
    const errorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    await jest.isolateModulesAsync(async () => {
      process.env.EMAIL_PROVIDER = "sendgrid";
      process.env.SENDGRID_API_KEY = "sg";
      const { sendCampaignEmail } = await import("../send");
      await expect(
        sendCampaignEmail({
          to: "t@example.com",
          subject: "s",
          html: "<p>h</p>",
          sanitize: false,
        })
      ).rejects.toThrow("smtp fail");
    });
    expect(providerSend).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls).toEqual(
      expect.arrayContaining([
        [
          "Campaign email send failed",
          expect.objectContaining({ provider: "sendgrid", recipient: "t@example.com" }),
        ],
      ])
    );
    expect(errorSpy.mock.calls).toEqual(
      expect.arrayContaining([
        [
          "Campaign email send failed",
          expect.objectContaining({ provider: "smtp", recipient: "t@example.com" }),
        ],
      ])
    );
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("throws when html is missing", async () => {
    const { sendCampaignEmail } = await import("../send");
    await expect(
      sendCampaignEmail({
        to: "a@b.com",
        subject: "Hi",
        sanitize: false,
      })
    ).rejects.toThrow("Missing html content for campaign email");
  });
});

