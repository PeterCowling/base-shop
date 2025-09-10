import type { CampaignOptions } from "../send";

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

describe("send core helpers", () => {
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

  describe("deriveText & ensureText", () => {
    it("cleans and normalizes HTML", async () => {
      const { deriveText } = await import("../send");
      const html =
        "<div>  Hello&nbsp;<strong>World</strong><style>.a{}</style><script>alert(1)</script>&amp; &lt;Test&gt; &#39;Quote&#39; &quot;Double&quot; </div>";
      expect(deriveText(html)).toBe("Hello World & <Test> 'Quote' \"Double\"");
    });

    it("throws when html is missing", async () => {
      const { ensureText } = await import("../send");
      expect(() => ensureText({ to: "a", subject: "s" } as any)).toThrow(
        "Missing html content for campaign email"
      );
    });

    it("returns original options when text exists", async () => {
      const { ensureText } = await import("../send");
      const opts: CampaignOptions = {
        to: "a",
        subject: "s",
        html: "<p>h</p>",
        text: "t",
      };
      expect(ensureText(opts)).toBe(opts);
    });

    it("derives text when missing", async () => {
      const { ensureText } = await import("../send");
      const result = ensureText({
        to: "a",
        subject: "s",
        html: "<p>Hello</p>",
      });
      expect(result.text).toBe("Hello");
    });
  });

  describe("loadProvider", () => {
    it("imports and caches SendgridProvider", async () => {
      await jest.isolateModulesAsync(async () => {
        process.env.SENDGRID_API_KEY = "sg";
        const { loadProvider } = await import("../send");
        const first = await loadProvider("sendgrid");
        const second = await loadProvider("sendgrid");
        expect(first).toBe(second);
        expect(SendgridProvider).toHaveBeenCalledTimes(1);
        expect(mockSendgridImport).toHaveBeenCalledTimes(1);
      });
    });

    it("imports and caches ResendProvider", async () => {
      await jest.isolateModulesAsync(async () => {
        process.env.RESEND_API_KEY = "rs";
        const { loadProvider } = await import("../send");
        const first = await loadProvider("resend");
        const second = await loadProvider("resend");
        expect(first).toBe(second);
        expect(ResendProvider).toHaveBeenCalledTimes(1);
        expect(mockResendImport).toHaveBeenCalledTimes(1);
      });
    });

    it("returns undefined when keys are missing", async () => {
      await jest.isolateModulesAsync(async () => {
        const { loadProvider } = await import("../send");
        expect(await loadProvider("sendgrid")).toBeUndefined();
        expect(await loadProvider("resend")).toBeUndefined();
        expect(mockSendgridImport).not.toHaveBeenCalled();
        expect(mockResendImport).not.toHaveBeenCalled();
      });
    });

    it("does not late-load providers when API key is set after first call", async () => {
      await jest.isolateModulesAsync(async () => {
        const { loadProvider } = await import("../send");
        const first = await loadProvider("sendgrid");
        process.env.SENDGRID_API_KEY = "sg";
        const second = await loadProvider("sendgrid");
        expect(first).toBeUndefined();
        expect(second).toBeUndefined();
      });
      expect(SendgridProvider).not.toHaveBeenCalled();
      expect(mockSendgridImport).not.toHaveBeenCalled();
    });

    it("does not late-load Resend provider when API key is set after first call", async () => {
      await jest.isolateModulesAsync(async () => {
        const { loadProvider } = await import("../send");
        const first = await loadProvider("resend");
        process.env.RESEND_API_KEY = "rs";
        const second = await loadProvider("resend");
        expect(first).toBeUndefined();
        expect(second).toBeUndefined();
      });
      expect(ResendProvider).not.toHaveBeenCalled();
      expect(mockResendImport).not.toHaveBeenCalled();
    });

    it("caches unknown providers as undefined", async () => {
      await jest.isolateModulesAsync(async () => {
        const { loadProvider } = await import("../send");
        const first = await loadProvider("custom");
        const second = await loadProvider("custom");
        expect(first).toBeUndefined();
        expect(second).toBeUndefined();
        expect(mockSendgridImport).not.toHaveBeenCalled();
        expect(mockResendImport).not.toHaveBeenCalled();
      });
    });
  });

  describe("sendCampaignEmail", () => {
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
          to: "t",
          subject: "s",
          html: '<p>Hi</p><img src="x" onerror="x"><script>bad()</script>',
        });
    });
      expect(mockSanitizeHtml).toHaveBeenCalled();
      expect(providerSend).toHaveBeenCalledWith(
        expect.objectContaining({ html: '<p>Hi</p><img src="x" />' })
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
          to: "t",
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
            to: "a",
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
          to: "t",
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
          to: "t",
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
          to: "t",
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
          to: "t",
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
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      await jest.isolateModulesAsync(async () => {
        process.env.EMAIL_PROVIDER = "sendgrid";
        process.env.SENDGRID_API_KEY = "sg";
        const { sendCampaignEmail } = await import("../send");
        await expect(
          sendCampaignEmail({
            to: "t",
            subject: "s",
            html: "<p>h</p>",
            sanitize: false,
          })
        ).rejects.toThrow("smtp fail");
      });
      expect(providerSend).toHaveBeenCalledTimes(1);
      expect(consoleSpy.mock.calls).toEqual(
        expect.arrayContaining([
          [
            "Campaign email send failed",
            expect.objectContaining({ provider: "sendgrid", recipient: "t" }),
          ],
        ])
      );
      consoleSpy.mockRestore();
    });
  });

  describe("sendWithRetry", () => {
    it("applies exponential backoff for retryable ProviderError", async () => {
      jest.useFakeTimers();
      const timeoutSpy = jest.spyOn(global, "setTimeout");
      const { sendWithRetry } = await import("../send");
      const { ProviderError } = await import("../providers/types");
      const provider = {
        send: jest.fn().mockRejectedValue(new ProviderError("x", true)),
      };
      const promise = sendWithRetry(
        provider as any,
        { to: "t", subject: "s" },
        4
      ).catch(() => {});
      await jest.runAllTimersAsync();
      await promise;
      expect(provider.send).toHaveBeenCalledTimes(4);
      expect(timeoutSpy).toHaveBeenNthCalledWith(1, expect.any(Function), 100);
      expect(timeoutSpy).toHaveBeenNthCalledWith(2, expect.any(Function), 200);
      expect(timeoutSpy).toHaveBeenNthCalledWith(3, expect.any(Function), 400);
      timeoutSpy.mockRestore();
      jest.useRealTimers();
    });

    it("retries when error object has retryable property", async () => {
      jest.useFakeTimers();
      mockHasProviderErrorFields.mockReturnValue(true);
      const { sendWithRetry } = await import("../send");
      const err = { retryable: true };
      const provider = { send: jest.fn().mockRejectedValue(err) };
      const promise = sendWithRetry(provider as any, {
        to: "t",
        subject: "s",
      }).catch(() => {});
      await jest.runAllTimersAsync();
      await promise;
      expect(provider.send).toHaveBeenCalledTimes(3);
      jest.useRealTimers();
    });

    it("does not retry when error object has retryable false", async () => {
      const { sendWithRetry } = await import("../send");
      const err = { retryable: false };
      const provider = { send: jest.fn().mockRejectedValue(err) };
      await expect(
        sendWithRetry(provider as any, { to: "t", subject: "s" })
      ).rejects.toBe(err);
      expect(provider.send).toHaveBeenCalledTimes(1);
    });

    it("retries up to default limit when provider rejects with empty object", async () => {
      jest.useFakeTimers();
      mockHasProviderErrorFields.mockReturnValue(true);
      const { sendWithRetry } = await import("../send");
      const err = {};
      const provider = { send: jest.fn().mockRejectedValue(err) };
      const expectation = expect(
        sendWithRetry(provider as any, { to: "t", subject: "s" })
      ).rejects.toBe(err);
      await jest.runAllTimersAsync();
      await expectation;
      expect(provider.send).toHaveBeenCalledTimes(3);
      jest.useRealTimers();
    });

    it("retries when error lacks retryable flag", async () => {
      jest.useFakeTimers();
      mockHasProviderErrorFields.mockReturnValue(false);
      const { sendWithRetry } = await import("../send");
      const provider = { send: jest.fn().mockRejectedValue(new Error("x")) };
      const promise = sendWithRetry(provider as any, {
        to: "t",
        subject: "s",
      }).catch(() => {});
      await jest.runAllTimersAsync();
      await promise;
      expect(provider.send).toHaveBeenCalledTimes(3);
      jest.useRealTimers();
    });

    it("throws immediately on non-retryable error", async () => {
      const { sendWithRetry } = await import("../send");
      const { ProviderError } = await import("../providers/types");
      const provider = {
        send: jest.fn().mockRejectedValue(new ProviderError("x", false)),
      };
      await expect(
        sendWithRetry(provider as any, { to: "t", subject: "s" })
      ).rejects.toBeInstanceOf(ProviderError);
      expect(provider.send).toHaveBeenCalledTimes(1);
    });
  });

  describe("sendWithNodemailer", () => {
    it("creates transport with undefined SMTP_URL", async () => {
      delete process.env.SMTP_URL;
      const { sendWithNodemailer } = await import("../send");
      await sendWithNodemailer({
        to: "to@example.com",
        subject: "Sub",
        html: "<p>H</p>",
        text: "T",
      });
      expect(mockCreateTransport).toHaveBeenCalledWith({ url: undefined });
      expect(mockSendMail).toHaveBeenCalledWith({
        from: "from@example.com",
        to: "to@example.com",
        subject: "Sub",
        html: "<p>H</p>",
        text: "T",
      });
    });

    it("creates transport with SMTP_URL and forwards fields", async () => {
      process.env.SMTP_URL = "smtp://test";
      const { sendWithNodemailer } = await import("../send");
      await sendWithNodemailer({
        to: "to@example.com",
        subject: "Sub",
        html: "<p>H</p>",
        text: "T",
      });
      expect(mockCreateTransport).toHaveBeenCalledWith({ url: "smtp://test" });
      expect(mockSendMail).toHaveBeenCalledWith({
        from: "from@example.com",
        to: "to@example.com",
        subject: "Sub",
        html: "<p>H</p>",
        text: "T",
      });
    });

    it("surfaces sendMail rejections", async () => {
      process.env.SMTP_URL = "smtp://test";
      const err = new Error("smtp fail");
      mockSendMail.mockRejectedValue(err);
      const { sendWithNodemailer } = await import("../send");
      await expect(
        sendWithNodemailer({
          to: "to@example.com",
          subject: "Sub",
          html: "<p>H</p>",
          text: "T",
        })
      ).rejects.toThrow("smtp fail");
      expect(mockCreateTransport).toHaveBeenCalledWith({ url: "smtp://test" });
      expect(mockSendMail).toHaveBeenCalledWith({
        from: "from@example.com",
        to: "to@example.com",
        subject: "Sub",
        html: "<p>H</p>",
        text: "T",
      });
    });

    it("surfaces getDefaultSender errors", async () => {
      process.env.SMTP_URL = "smtp://test";
      const err = new Error("sender fail");
      mockGetDefaultSender.mockImplementation(() => {
        throw err;
      });
      const { sendWithNodemailer } = await import("../send");
      await expect(
        sendWithNodemailer({
          to: "to@example.com",
          subject: "Sub",
          html: "<p>H</p>",
          text: "T",
        })
      ).rejects.toThrow("sender fail");
      expect(mockSendMail).not.toHaveBeenCalled();
    });
  });

  describe("sendCampaignEmail", () => {
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
});
