// Focus: input validation for sendCampaignEmail

import { cleanupEnv,resetMocks, setupEnv } from "./sendCampaignTestUtils";

jest.mock("../config", () => ({
  getDefaultSender: () => "from@example.com",
}));

describe("send core – sendCampaignEmail (validation)", () => {
  beforeEach(() => {
    resetMocks();
    setupEnv();
  });

  afterEach(() => {
    cleanupEnv();
  });

  it("throws when html is missing", async () => {
    const { sendCampaignEmail } = await import("../send");
    await expect(
      sendCampaignEmail({
        to: "a@b.com",
        subject: "Hi",
        sanitize: false,
      } as any)
    ).rejects.toThrow("Missing html content for campaign email");
  });

  it("throws when bcc is invalid", async () => {
    const { sendCampaignEmail } = await import("../send");
    await expect(
      sendCampaignEmail({
        to: "a@b.com",
        bcc: "invalid",
        subject: "Hi",
        html: "<p>Hello</p>",
        sanitize: false,
      })
    ).rejects.toThrow("Invalid bcc email address: invalid");
  });
});
