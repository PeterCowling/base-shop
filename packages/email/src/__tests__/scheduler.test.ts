import path from "node:path";
import { promises as fs } from "node:fs";
import { DATA_ROOT } from "@platform-core/dataRoot";

process.env.CART_COOKIE_SECRET = "secret";

jest.mock("../index", () => ({
  __esModule: true,
  sendCampaignEmail: jest.fn().mockResolvedValue(undefined),
  resolveSegment: jest.fn(),
  filterUnsubscribed: jest
    .fn()
    .mockImplementation((_shop: string, emails: string[]) =>
      Promise.resolve(emails)
    ),
}));

jest.mock("@platform-core/analytics", () => ({
  __esModule: true,
  trackEvent: jest.fn().mockResolvedValue(undefined),
}));
const { sendCampaignEmail } = require("../index");
const sendCampaignEmailMock = sendCampaignEmail as jest.Mock;

describe("sendScheduledCampaigns", () => {
  const shop = "schedulertest";
  const shopDir = path.join(DATA_ROOT, shop);

  beforeEach(async () => {
    jest.clearAllMocks();
    await fs.rm(shopDir, { recursive: true, force: true });
    await fs.mkdir(shopDir, { recursive: true });
  });

  it("sends due campaigns and marks them as sent", async () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const future = new Date(Date.now() + 1000).toISOString();
    const campaigns = [
      {
        id: "c1",
        recipients: ["past@example.com"],
        subject: "Past",
        body: "<p>Past</p>",
        sendAt: past,
      },
      {
        id: "c2",
        recipients: ["future@example.com"],
        subject: "Future",
        body: "<p>Future</p>",
        sendAt: future,
      },
    ];
    await fs.writeFile(
      path.join(shopDir, "campaigns.json"),
      JSON.stringify(campaigns, null, 2),
      "utf8"
    );

    const { sendScheduledCampaigns } = await import("../scheduler");
    await sendScheduledCampaigns();

    expect(sendCampaignEmailMock).toHaveBeenCalledTimes(1);
    expect(sendCampaignEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: "past@example.com", subject: "Past" })
    );

    const updated = JSON.parse(
      await fs.readFile(path.join(shopDir, "campaigns.json"), "utf8")
    );
    const pastCampaign = updated.find((c: any) => c.id === "c1");
    const futureCampaign = updated.find((c: any) => c.id === "c2");
    expect(pastCampaign.sentAt).toBeDefined();
    expect(futureCampaign.sentAt).toBeUndefined();
  });
});

