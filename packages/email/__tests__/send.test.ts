import { ProviderError } from "../src/providers/types";

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
});

