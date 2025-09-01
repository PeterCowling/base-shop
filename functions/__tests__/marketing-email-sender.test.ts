import { onScheduled, sendScheduledCampaigns } from "../marketing-email-sender";
import { sendDueCampaigns } from "@acme/email";

jest.mock("@acme/email", () => ({
  sendDueCampaigns: jest.fn(),
}));

describe("marketing-email-sender", () => {
  const sendDueCampaignsMock = sendDueCampaigns as jest.Mock;

  beforeEach(() => {
    sendDueCampaignsMock.mockClear();
  });

  it("calls sendDueCampaigns from onScheduled", async () => {
    await onScheduled();
    expect(sendDueCampaignsMock).toHaveBeenCalledTimes(1);
  });

  it("calls sendDueCampaigns from sendScheduledCampaigns", async () => {
    await sendScheduledCampaigns();
    expect(sendDueCampaignsMock).toHaveBeenCalledTimes(1);
  });
});

