// Focus: template rendering behavior of sendCampaignEmail

let mockRenderTemplate: jest.Mock;

jest.mock("../templates", () => ({
  renderTemplate: (...args: any[]) => mockRenderTemplate(...args),
}));

jest.mock("../config", () => ({
  getDefaultSender: () => "from@example.com",
}));

import {
  resetMocks,
  mockSendgridSend,
  setupEnv,
  cleanupEnv,
} from "./sendCampaignTestUtils";

describe("send core – sendCampaignEmail (rendering)", () => {
  beforeEach(() => {
    resetMocks();
    mockRenderTemplate = jest.fn();
    setupEnv();
  });

  afterEach(() => {
    cleanupEnv();
  });

  it("renders templates when templateId is provided", async () => {
    mockRenderTemplate.mockReturnValue("<p>Rendered</p>");
    (mockSendgridSend as jest.Mock).mockResolvedValue(undefined);
    await jest.isolateModulesAsync(async () => {
      process.env.EMAIL_PROVIDER = "sendgrid";
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
    expect(mockSendgridSend).toHaveBeenCalledWith(
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
});

