import { jest } from "@jest/globals";
import path from "node:path";
import { promises as fs } from "node:fs";
import { DATA_ROOT } from "@platform-core/dataRoot";
import type { CampaignStore, Campaign } from "@acme/email";

process.env.CART_COOKIE_SECRET = "secret";
process.env.RESEND_API_KEY = "test";

let createFsCampaignStore: (root: string) => CampaignStore;

jest.mock("@acme/email", () => {
  const actual = jest.requireActual("@acme/email") as Record<string, any>;
  return { __esModule: true, ...actual, sendCampaignEmail: jest.fn() };
});

jest.mock("@platform-core/analytics", () => ({
  __esModule: true,
  trackEvent: jest.fn(),
}));

let sendCampaignEmail: jest.Mock;
beforeAll(async () => {
  const mod = (await import("@acme/email")) as any;
  ({ sendCampaignEmail, createFsCampaignStore } = mod);
});

describe("sendScheduledCampaigns", () => {
  const shop = "segshop2";
  const shopDir = path.join(DATA_ROOT, shop);
  let store: CampaignStore;

  beforeEach(async () => {
    jest.clearAllMocks();
    await fs.rm(shopDir, { recursive: true, force: true });
    await fs.mkdir(shopDir, { recursive: true });
    store = createFsCampaignStore(DATA_ROOT);
  });

  test("refreshes segment recipients at send time and uses manual list otherwise", async () => {
    await fs.writeFile(
      path.join(shopDir, "analytics.jsonl"),
      JSON.stringify({ type: "segment:vip", email: "new@example.com" }) + "\n",
      "utf8"
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
      "utf8"
    );

    const { sendScheduledCampaigns } = await import("../marketing-email-sender");
    await sendScheduledCampaigns(store);

    expect(sendCampaignEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "new@example.com", subject: "Seg" })
    );
    expect(sendCampaignEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "manual@example.com", subject: "Man" })
    );

    const updated = JSON.parse(
      await fs.readFile(path.join(shopDir, "campaigns.json"), "utf8")
    );
    const seg = updated.find((c: any) => c.id === "c1");
    const man = updated.find((c: any) => c.id === "c2");
    expect(seg.recipients).toEqual(["new@example.com"]);
    expect(seg.sentAt).toBeDefined();
    expect(man.recipients).toEqual(["manual@example.com"]);
    expect(man.sentAt).toBeDefined();
  });
  test("supports custom stores", async () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const campaigns: Campaign[] = [
      {
        id: "c1",
        recipients: ["a@example.com"],
        subject: "Hi",
        body: "<p>Hi</p>",
        sendAt: past,
      },
    ];
    const custom: CampaignStore = {
      listShops: jest.fn().mockResolvedValue(["shop"]),
      readCampaigns: jest.fn().mockResolvedValue(campaigns),
      writeCampaigns: jest.fn().mockResolvedValue(undefined),
    };

    const { sendScheduledCampaigns } = await import("../marketing-email-sender");
    await sendScheduledCampaigns(custom);

    expect(custom.listShops).toHaveBeenCalled();
    expect(custom.writeCampaigns).toHaveBeenCalled();
    expect(sendCampaignEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "a@example.com" })
    );
  });
});
