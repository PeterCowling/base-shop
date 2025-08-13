import path from "node:path";
import { promises as fs } from "node:fs";
import { DATA_ROOT } from "@platform-core/dataRoot";

process.env.CART_COOKIE_SECRET = "secret";

jest.mock("../index", () => ({
  __esModule: true,
  sendCampaignEmail: jest.fn().mockResolvedValue(undefined),
  resolveSegment: jest.fn(),
}));

jest.mock("@platform-core/analytics", () => ({
  __esModule: true,
  trackEvent: jest.fn().mockResolvedValue(undefined),
}));

let sendCampaignEmailMock: jest.Mock;

describe("sendScheduledCampaigns", () => {
  const shop = "schedulertest";
  const shopDir = path.join(DATA_ROOT, shop);

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.resetModules();
    const { sendCampaignEmail } = require("../index");
    sendCampaignEmailMock = sendCampaignEmail as jest.Mock;
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

  it("processes recipients in batches with delays", async () => {
    const timeoutSpy = jest.spyOn(global, "setTimeout");
    process.env.EMAIL_BATCH_SIZE = "2";
    process.env.EMAIL_BATCH_DELAY_MS = "1";
    const past = new Date(Date.now() - 1000).toISOString();
    const recipients = [
      "a@example.com",
      "b@example.com",
      "c@example.com",
      "d@example.com",
      "e@example.com",
    ];
    const campaigns = [
      {
        id: "c1",
        recipients,
        subject: "Batch",
        body: "<p>Batch</p>",
        sendAt: past,
      },
    ];
    await fs.writeFile(
      path.join(shopDir, "campaigns.json"),
      JSON.stringify(campaigns, null, 2),
      "utf8"
    );

    const { sendScheduledCampaigns } = await import("../scheduler");
    await sendScheduledCampaigns();
    expect(sendCampaignEmailMock).toHaveBeenCalledTimes(5);
    expect(timeoutSpy).toHaveBeenCalledTimes(2);
    expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1);
    timeoutSpy.mockRestore();
    delete process.env.EMAIL_BATCH_SIZE;
    delete process.env.EMAIL_BATCH_DELAY_MS;
  });
});

