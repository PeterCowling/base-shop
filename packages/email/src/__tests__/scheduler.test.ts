import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import * as fsSync from "node:fs";

let DATA_ROOT: string;
const trackEvent = jest.fn();
const sendCampaignEmail = jest.fn().mockResolvedValue(undefined);

jest.mock("@platform-core/dataRoot", () => ({
  get DATA_ROOT() {
    return DATA_ROOT;
  },
  resolveDataRoot: () => DATA_ROOT,
}));

jest.mock("@platform-core/analytics", () => ({ trackEvent }));
jest.mock("../send", () => ({ sendCampaignEmail }));

describe("sendScheduledCampaigns", () => {
  beforeEach(() => {
    DATA_ROOT = fsSync.mkdtempSync(path.join(os.tmpdir(), "email-scheduler-"));
  });

  afterEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    await fs.rm(DATA_ROOT, { recursive: true, force: true });
  });

  it("dispatches due campaigns and marks sentAt", async () => {
    const shop = "shop";
    await fs.mkdir(path.join(DATA_ROOT, shop), { recursive: true });
    const past = new Date(Date.now() - 1000).toISOString();
    const future = new Date(Date.now() + 60_000).toISOString();
    const campaigns = [
      {
        id: "1",
        recipients: ["a@example.com"],
        subject: "Now",
        body: "<p>Hi</p>",
        sendAt: past,
      },
      {
        id: "2",
        recipients: ["b@example.com"],
        subject: "Later",
        body: "<p>Later</p>",
        sendAt: future,
      },
    ];
    await fs.writeFile(
      path.join(DATA_ROOT, shop, "campaigns.json"),
      JSON.stringify(campaigns, null, 2),
    );

    const { sendScheduledCampaigns } = await import("../scheduler");
    await sendScheduledCampaigns();

    expect(sendCampaignEmail).toHaveBeenCalledTimes(1);
    expect(sendCampaignEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "a@example.com", subject: "Now" }),
    );
    expect(trackEvent).toHaveBeenCalledWith(shop, {
      type: "email_sent",
      campaign: "1",
    });

    const stored = JSON.parse(
      await fs.readFile(path.join(DATA_ROOT, shop, "campaigns.json"), "utf8"),
    );
    expect(stored[0].sentAt).toBeDefined();
    expect(stored[1].sentAt).toBeUndefined();
  });
});
