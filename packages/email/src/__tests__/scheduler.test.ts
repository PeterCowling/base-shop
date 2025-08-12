import { promises as fs, mkdtempSync } from "node:fs";
import path from "node:path";
import os from "node:os";

jest.mock("@platform-core/analytics", () => ({
  trackEvent: jest.fn(),
}));

const trackEvent = require("@platform-core/analytics").trackEvent as jest.Mock;

const tmpRoot = mkdtempSync(path.join(os.tmpdir(), "email-scheduler-"));
jest.mock("@platform-core/dataRoot", () => ({
  DATA_ROOT: tmpRoot,
  resolveDataRoot: () => tmpRoot,
}));

jest.mock("../send", () => ({
  sendCampaignEmail: jest.fn(),
}));

const sendCampaignEmail = require("../send").sendCampaignEmail as jest.Mock;

import { sendScheduledCampaigns } from "../index";

describe("sendScheduledCampaigns", () => {
  const shop = "test-shop";
  const campaignsFile = path.join(tmpRoot, shop, "campaigns.json");

  beforeEach(async () => {
    jest.clearAllMocks();
    await fs.mkdir(path.dirname(campaignsFile), { recursive: true });
    const now = new Date();
    const campaigns = [
      {
        id: "1",
        recipients: ["user@example.com"],
        subject: "Hello",
        body: "<p>Hi</p>",
        sendAt: new Date(now.getTime() - 1000).toISOString(),
      },
      {
        id: "2",
        recipients: ["later@example.com"],
        subject: "Later",
        body: "<p>Later</p>",
        sendAt: new Date(now.getTime() + 60_000).toISOString(),
      },
    ];
    await fs.writeFile(campaignsFile, JSON.stringify(campaigns, null, 2));
  });

  it("sends due campaigns and marks them sent", async () => {
    await sendScheduledCampaigns();

    expect(sendCampaignEmail).toHaveBeenCalledTimes(1);
    expect(sendCampaignEmail).toHaveBeenCalledWith({
      to: "user@example.com",
      subject: "Hello",
      html: expect.any(String),
    });
    expect(trackEvent).toHaveBeenCalledWith(shop, {
      type: "email_sent",
      campaign: "1",
    });

    const json = JSON.parse(await fs.readFile(campaignsFile, "utf8"));
    expect(json[0].sentAt).toBeDefined();
    expect(json[1].sentAt).toBeUndefined();
  });
});
