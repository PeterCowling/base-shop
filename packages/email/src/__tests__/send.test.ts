import { ProviderError } from "../providers/types";

// Prefix mock variables with `mock` so Jest's hoisted `jest.mock`
// factory functions can safely reference them.
let mockSendgridSend: jest.Mock;
let mockResendSend: jest.Mock;
let mockSendMail: jest.Mock;

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

jest.mock("../scheduler", () => ({}));
jest.mock("@platform-core/analytics", () => ({
  trackEvent: jest.fn(),
}));
// The templates module imports `@acme/ui`, which in turn pulls in many
// dependencies (including JSON imports with `assert` attributes) that
// Jest cannot parse in this test environment. Stub the module to avoid
// loading the real UI package.
jest.mock("@acme/ui", () => ({ marketingEmailTemplates: [] }));

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
    delete process.env.SENDGRID_MARKETING_KEY;
    delete process.env.RESEND_API_KEY;
    delete process.env.CAMPAIGN_FROM;
  });

  it("falls back to alternate provider when primary fails", async () => {
    mockSendgridSend = jest
      .fn()
      .mockRejectedValue(new ProviderError("fail", false));
    mockResendSend = jest.fn().mockResolvedValue(undefined);
    mockSendMail = jest.fn();

    setupEnv();

    const { sendCampaignEmail } = await import("../index");
    await sendCampaignEmail({
      to: "to@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
    });

    expect(mockSendgridSend).toHaveBeenCalledTimes(1);
    expect(mockResendSend).toHaveBeenCalledTimes(1);
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
  });

  it("retries with exponential backoff on retryable error", async () => {
    const timeoutSpy = jest.spyOn(global, "setTimeout");
    mockSendgridSend = jest
      .fn()
      .mockRejectedValueOnce(new ProviderError("temporary", true))
      .mockResolvedValueOnce(undefined);
    mockResendSend = jest.fn();
    mockSendMail = jest.fn();

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
    expect(
      timeoutSpy.mock.calls.some(([_, ms]) => ms === 100)
    ).toBe(true);

    await promise;

    expect(mockSendgridSend).toHaveBeenCalledTimes(2);
    expect(mockSendgridSend.mock.calls[0][0].text).toBe("HTML");
    expect(mockSendgridSend.mock.calls[1][0].text).toBe("HTML");
    expect(mockResendSend).not.toHaveBeenCalled();
    timeoutSpy.mockRestore();
  });

  it("logs provider, campaign, and recipient on failure", async () => {
    mockSendgridSend = jest
      .fn()
      .mockRejectedValue(new ProviderError("fail", false));
    mockResendSend = jest.fn().mockResolvedValue(undefined);
    mockSendMail = jest.fn();

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
