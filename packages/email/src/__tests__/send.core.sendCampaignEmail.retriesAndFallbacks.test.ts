// Focus: retry logic and provider fallback including nodemailer

jest.mock("../config", () => ({
  getDefaultSender: () => "from@example.com",
}));

import {
  resetMocks,
  mockSendgridSend,
  mockResendSend,
  mockSendMail,
  mockHasProviderErrorFields,
  setupEnv,
  cleanupEnv,
} from "./sendCampaignTestUtils";

describe("send core – sendCampaignEmail (retries & fallbacks)", () => {
  let warnSpy: jest.SpiedFunction<typeof console.warn>;
  let errorSpy: jest.SpiedFunction<typeof console.error>;
  let loggerModule: typeof import("@acme/shared-utils");
  let originalWarn: any;
  let originalError: any;

  beforeEach(async () => {
    loggerModule = await import("@acme/shared-utils");
    originalWarn = loggerModule.logger.warn;
    originalError = loggerModule.logger.error;
    warnSpy = jest.fn() as unknown as jest.SpyInstance;
    errorSpy = jest.fn() as unknown as jest.SpyInstance;
    loggerModule.logger.warn = warnSpy as any;
    loggerModule.logger.error = errorSpy as any;
    resetMocks();
    (mockHasProviderErrorFields as jest.Mock).mockReturnValue(true);
    setupEnv();
  });

  afterEach(() => {
    cleanupEnv();
    loggerModule.logger.warn = originalWarn;
    loggerModule.logger.error = originalError;
  });

  it("retries failed provider and eventually sends", async () => {
    jest.useFakeTimers();
    (mockSendgridSend as jest.Mock)
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce(undefined);
    const timeoutSpy = jest.spyOn(global, "setTimeout");
    await jest.isolateModulesAsync(async () => {
      process.env.EMAIL_PROVIDER = "sendgrid";
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
    expect(mockSendgridSend).toHaveBeenCalledTimes(2);
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100);
    timeoutSpy.mockRestore();
    jest.useRealTimers();
  });

  it("falls back to next providers and nodemailer on non-retryable errors", async () => {
    const { ProviderError } = await import("../providers/types");
    (mockSendgridSend as jest.Mock).mockRejectedValue(new ProviderError("x", false));
    (mockResendSend as jest.Mock).mockRejectedValue(new ProviderError("y", false));
    await jest.isolateModulesAsync(async () => {
      process.env.SMTP_URL = "smtp://test";
      process.env.EMAIL_PROVIDER = "sendgrid";
      const { sendCampaignEmail } = await import("../send");
      await sendCampaignEmail({
        to: "t@example.com",
        subject: "s",
        html: "<p>h</p>",
        sanitize: false,
      });
    });
    expect(mockSendgridSend).toHaveBeenCalledTimes(1);
    expect(mockResendSend).toHaveBeenCalledTimes(1);
    // Reaching here means Nodemailer was attempted; we assert sendMail was created once.
    expect((mockSendMail as jest.Mock).mock.calls.length).toBe(1);
  });

  it("propagates error when all providers fail", async () => {
    const { ProviderError } = await import("../providers/types");
    (mockSendgridSend as jest.Mock).mockRejectedValue(new ProviderError("sg fail", false));
    (mockSendMail as jest.Mock).mockRejectedValue(new Error("smtp fail"));
    warnSpy = jest.fn() as unknown as jest.SpyInstance;
    errorSpy = jest.fn() as unknown as jest.SpyInstance;
    jest.doMock("@acme/shared-utils", () => {
      const actual = jest.requireActual("@acme/shared-utils");
      return {
        ...actual,
        logger: {
          ...actual.logger,
          warn: warnSpy,
          error: errorSpy,
        },
      };
    });
    await jest.isolateModulesAsync(async () => {
      process.env.EMAIL_PROVIDER = "sendgrid";
      delete process.env.RESEND_API_KEY; // ensure only sendgrid -> smtp paths are attempted
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
    jest.resetModules();
    expect(mockSendgridSend).toHaveBeenCalledTimes(1);
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
  });
});
