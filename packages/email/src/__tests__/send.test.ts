import { ProviderError } from "../providers/types";

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

jest.mock("../scheduler", () => ({}));
jest.mock("@platform-core/analytics", () => ({
  trackEvent: jest.fn(),
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
    expect(sendgridSendMock).toHaveBeenCalledWith({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "HTML",
    });
    expect(resendSendMock).toHaveBeenCalledWith({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "HTML",
    });
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
    expect(sendgridSendMock.mock.calls[0][0].text).toBe("HTML");
    expect(sendgridSendMock.mock.calls[1][0].text).toBe("HTML");
    expect(resendSendMock).not.toHaveBeenCalled();
    timeoutSpy.mockRestore();
  });

  it("logs provider, campaign, and recipient on failure", async () => {
    sendgridSendMock = jest
      .fn()
      .mockRejectedValue(new ProviderError("fail", false));
    resendSendMock = jest.fn().mockResolvedValue(undefined);
    sendMailMock = jest.fn();

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
