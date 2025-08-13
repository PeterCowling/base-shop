import { jest } from "@jest/globals";

jest.mock("@acme/email", () => ({
  __esModule: true,
  sendDueCampaigns: jest.fn(),
}));

const { sendDueCampaigns } = require("@acme/email");
const { sendScheduledCampaigns, onScheduled } = require("../marketing-email-sender");

describe("marketing-email-sender", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("delegates to sendDueCampaigns", async () => {
    await sendScheduledCampaigns();
    expect(sendDueCampaigns).toHaveBeenCalledTimes(1);
    await onScheduled();
    expect(sendDueCampaigns).toHaveBeenCalledTimes(2);
  });
});
