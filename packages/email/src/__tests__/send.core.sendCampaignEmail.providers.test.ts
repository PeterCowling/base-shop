// Focus: provider selection and fallbacks (excluding retries)

jest.mock("../config", () => ({
  getDefaultSender: () => "from@example.com",
}));

import {
  resetMocks,
  mockSendgridSend,
  mockResendSend,
  setupEnv,
  cleanupEnv,
} from "./sendCampaignTestUtils";

describe("send core – sendCampaignEmail (providers)", () => {
  beforeEach(() => {
    resetMocks();
    setupEnv();
    delete process.env.SMTP_URL;
  });

  afterEach(() => {
    cleanupEnv();
  });

  it("throws for invalid EMAIL_PROVIDER", async () => {
    await jest.isolateModulesAsync(async () => {
      const { sendCampaignEmail } = await import("../send");
      process.env.EMAIL_PROVIDER = "invalid" as any;
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

  it("uses Resend provider when configured", async () => {
    (mockResendSend as jest.Mock).mockResolvedValue(undefined);
    await jest.isolateModulesAsync(async () => {
      process.env.EMAIL_PROVIDER = "resend";
      const { sendCampaignEmail } = await import("../send");
      await sendCampaignEmail({
        to: "t@example.com",
        subject: "s",
        html: "<p>h</p>",
        sanitize: false,
      });
    });
    expect(mockResendSend).toHaveBeenCalledTimes(1);
  });

  it("falls back to Sendgrid when Resend key is missing", async () => {
    (mockSendgridSend as jest.Mock).mockResolvedValue(undefined);
    await jest.isolateModulesAsync(async () => {
      process.env.EMAIL_PROVIDER = "resend";
      delete process.env.RESEND_API_KEY;
      const { sendCampaignEmail } = await import("../send");
      await sendCampaignEmail({
        to: "t@example.com",
        subject: "s",
        html: "<p>h</p>",
        sanitize: false,
      });
    });
    expect(mockSendgridSend).toHaveBeenCalledTimes(1);
  });
});

