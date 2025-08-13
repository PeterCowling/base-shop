import { ProviderError } from "../providers/types";

jest.mock("@sentry/node", () => ({ captureException: jest.fn() }));
jest.mock("@platform-core/analytics", () => ({ trackEvent: jest.fn() }));

let sendgridSendMock: jest.Mock;
let resendSendMock: jest.Mock;
let sendMailMock: jest.Mock;

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(() => ({
      sendMail: (...args: any[]) => sendMailMock(...args),
    })),
  },
}));

jest.mock("../providers/sendgrid", () => ({
  SendgridProvider: jest.fn().mockImplementation(() => ({
    send: (...args: any[]) => sendgridSendMock(...args),
  })),
}));

jest.mock("../providers/resend", () => ({
  ResendProvider: jest.fn().mockImplementation(() => ({
    send: (...args: any[]) => resendSendMock(...args),
  })),
}));

describe("sendCampaignEmail fallback and retry", () => {
  const setupEnv = () => {
    process.env.EMAIL_PROVIDER = "sendgrid";
    process.env.SENDGRID_API_KEY = "sg";
    process.env.RESEND_API_KEY = "rs";
    process.env.CAMPAIGN_FROM = "campaign@example.com";
  };

  afterEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    jest.clearAllTimers();
    delete process.env.EMAIL_PROVIDER;
    delete process.env.SENDGRID_API_KEY;
    delete process.env.RESEND_API_KEY;
    delete process.env.CAMPAIGN_FROM;
  });

  it("falls back to alternate provider when primary fails", async () => {
    sendgridSendMock = jest
      .fn()
      .mockRejectedValue(new ProviderError("fail", false));
    resendSendMock = jest.fn().mockResolvedValue(undefined);
    sendMailMock = jest.fn();

    setupEnv();

    const { sendCampaignEmail } = await import("../index");
    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
    });

    expect(sendgridSendMock).toHaveBeenCalledTimes(1);
    expect(resendSendMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it("retries with exponential backoff on retryable error", async () => {
    const timeoutSpy = jest.spyOn(global, "setTimeout");
    sendgridSendMock = jest
      .fn()
      .mockRejectedValueOnce(new ProviderError("temporary", true))
      .mockResolvedValueOnce(undefined);
    resendSendMock = jest.fn();
    sendMailMock = jest.fn();

    setupEnv();

    const { sendCampaignEmail } = await import("../index");

    const promise = sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
    });

    await Promise.resolve();
    expect(sendgridSendMock).toHaveBeenCalledTimes(1);
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 100);

    await promise;

    expect(sendgridSendMock).toHaveBeenCalledTimes(2);
    expect(resendSendMock).not.toHaveBeenCalled();
    timeoutSpy.mockRestore();
  });

  it("logs provider errors with context", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    sendgridSendMock = jest
      .fn()
      .mockRejectedValue(new ProviderError("fail", false));
    resendSendMock = jest.fn().mockResolvedValue(undefined);
    sendMailMock = jest.fn();

    setupEnv();

    const { sendCampaignEmail } = await import("../index");
    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      campaignId: "cmp1",
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Provider send error",
      expect.objectContaining({
        provider: "sendgrid",
        campaignId: "cmp1",
        to: "to@example.com",
      })
    );
    consoleErrorSpy.mockRestore();
  });
});
