import path from "node:path";
import { promises as fs } from "node:fs";
import { DATA_ROOT } from "@platform-core/dataRoot";

jest.mock("../send", () => ({
  __esModule: true,
  sendCampaignEmail: jest.fn(),
}));

jest.mock("@platform-core/analytics", () => ({
  __esModule: true,
  trackEvent: jest.fn(),
}));

const sendCampaignEmail = require("../send").sendCampaignEmail as jest.Mock;

describe("scheduler", () => {
  const shop = "schedshop";
  const shopDir = path.join(DATA_ROOT, shop);

  beforeEach(async () => {
    jest.clearAllMocks();
    await fs.rm(shopDir, { recursive: true, force: true });
    await fs.mkdir(shopDir, { recursive: true });
  });

  test("createCampaign sends immediately and lists campaigns", async () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const { createCampaign, listCampaigns } = await import("../scheduler");
    await createCampaign({
      shop,
      to: "user@example.com",
      subject: "Sub",
      body: "<p>Body</p>",
      sendAt: past,
    });
    expect(sendCampaignEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "user@example.com", subject: "Sub" })
    );
    const campaigns = await listCampaigns(shop);
    expect(campaigns).toHaveLength(1);
    expect(campaigns[0].sentAt).toBeDefined();
  });

  test("sendDueCampaigns refreshes segment recipients and uses manual list", async () => {
    await fs.writeFile(
      path.join(shopDir, "analytics.jsonl"),
      JSON.stringify({ type: "segment:vip", email: "new@example.com" }) + "\n",
      "utf8",
    );
    const past = new Date(Date.now() - 1000).toISOString();
    const campaigns = [
      {
        id: "c1",
        recipients: ["old@example.com"],
        subject: "Seg",
        body: "<p>Seg</p>",
        segment: "vip",
        sendAt: past,
      },
      {
        id: "c2",
        recipients: ["manual@example.com"],
        subject: "Man",
        body: "<p>Man</p>",
        segment: null,
        sendAt: past,
      },
    ];
    await fs.writeFile(
      path.join(shopDir, "campaigns.json"),
      JSON.stringify(campaigns, null, 2),
      "utf8",
    );
    const { sendDueCampaigns } = await import("../scheduler");
    await sendDueCampaigns();
    expect(sendCampaignEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "new@example.com", subject: "Seg" })
    );
    expect(sendCampaignEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "manual@example.com", subject: "Man" })
    );
    const updated = JSON.parse(
      await fs.readFile(path.join(shopDir, "campaigns.json"), "utf8"),
    );
    const seg = updated.find((c: any) => c.id === "c1");
    const man = updated.find((c: any) => c.id === "c2");
    expect(seg.recipients).toEqual(["new@example.com"]);
    expect(seg.sentAt).toBeDefined();
    expect(man.recipients).toEqual(["manual@example.com"]);
    expect(man.sentAt).toBeDefined();
  });
});
