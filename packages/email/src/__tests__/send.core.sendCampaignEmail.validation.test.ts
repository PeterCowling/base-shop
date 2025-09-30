// Focus: input validation for sendCampaignEmail

jest.mock("../config", () => ({
  getDefaultSender: () => "from@example.com",
}));

import { resetMocks, setupEnv, cleanupEnv } from "./sendCampaignTestUtils";

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
});

