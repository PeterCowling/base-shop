import path from "node:path";
import { promises as fs } from "node:fs";
import { DATA_ROOT } from "@platform-core/dataRoot";
import { setCampaignStore, fsCampaignStore } from "../storage";
import type { CampaignStore, Campaign } from "../storage";

process.env.CART_COOKIE_SECRET = "secret";

jest.mock(
  "@acme/ui",
  () => ({
    __esModule: true,
    marketingEmailTemplates: [],
  }),
  { virtual: true },
);

jest.mock("../send", () => ({
  __esModule: true,
  sendCampaignEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../segments", () => ({
  __esModule: true,
  resolveSegment: jest.fn(),
}));

jest.mock("@platform-core/analytics", () => ({
  __esModule: true,
  trackEvent: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@platform-core/repositories/analytics.server", () => ({
  __esModule: true,
  listEvents: jest.fn().mockResolvedValue([]),
}));
const { sendCampaignEmail } = require("../send");
const sendCampaignEmailMock = sendCampaignEmail as jest.Mock;
const { listEvents } = require("@platform-core/repositories/analytics.server");
const listEventsMock = listEvents as jest.Mock;

describe("scheduler", () => {
  const shop = "schedulertest";
  const shopDir = path.join(DATA_ROOT, shop);

  beforeEach(async () => {
    jest.clearAllMocks();
    setCampaignStore(fsCampaignStore);
    await fs.rm(shopDir, { recursive: true, force: true });
    await fs.mkdir(shopDir, { recursive: true });
    listEventsMock.mockResolvedValue([]);
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
      "utf8",
    );

    const { sendDueCampaigns } = await import("../scheduler");
    await sendDueCampaigns();

    expect(sendCampaignEmailMock).toHaveBeenCalledTimes(1);
    expect(sendCampaignEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: "past@example.com", subject: "Past" }),
    );

    const updated = JSON.parse(
      await fs.readFile(path.join(shopDir, "campaigns.json"), "utf8"),
    );
    const pastCampaign = updated.find((c: any) => c.id === "c1");
    const futureCampaign = updated.find((c: any) => c.id === "c2");
    expect(pastCampaign.sentAt).toBeDefined();
    expect(futureCampaign.sentAt).toBeUndefined();
  });

  it("includes token in tracking pixel URL", async () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const campaigns = [
      {
        id: "c1",
        recipients: ["token@example.com"],
        subject: "Token",
        body: "<p>Token</p>",
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

    const call = sendCampaignEmailMock.mock.calls[0][0];
    expect(call.html).toMatch(/open\?shop=.*&campaign=.*&t=\d+/);
  });

  it("creates campaigns and lists them", async () => {
    const { createCampaign, listCampaigns } = await import("../scheduler");
    const future = new Date(Date.now() + 1000).toISOString();
    const id = await createCampaign({
      shop,
      recipients: ["user@example.com"],
      subject: "Hello",
      body: "<p>Hello</p>",
      sendAt: future,
    });
    expect(typeof id).toBe("string");
    expect(sendCampaignEmailMock).not.toHaveBeenCalled();

    const campaigns = await listCampaigns(shop);
    const created = campaigns.find((c) => c.id === id);
    expect(created).toBeDefined();
    expect(created?.subject).toBe("Hello");
  });

  it("supports custom campaign stores", async () => {
    const memory: Record<string, Campaign[]> = {};
    const customStore: CampaignStore = {
      async readCampaigns(s) {
        return memory[s] || [];
      },
      async writeCampaigns(s, items) {
        memory[s] = items;
      },
      async listShops() {
        return Object.keys(memory);
      },
    };
    setCampaignStore(customStore);

    const { createCampaign, sendDueCampaigns } = await import("../scheduler");
    const future = new Date(Date.now() + 1000).toISOString();
    await createCampaign({
      shop,
      recipients: ["user@example.com"],
      subject: "Hi",
      body: "<p>Hi</p>",
      sendAt: future,
    });
    expect(memory[shop]).toHaveLength(1);

    memory[shop][0].sendAt = new Date(Date.now() - 1000).toISOString();
    await sendDueCampaigns();
    expect(memory[shop][0].sentAt).toBeDefined();
    expect(sendCampaignEmailMock).toHaveBeenCalled();
  });

  it("skips unsubscribed recipients and personalizes unsubscribe links", async () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const campaigns = [
      {
        id: "c1",
        recipients: ["stay@example.com", "leave@example.com"],
        subject: "Hi",
        body: "<p>Hello %%UNSUBSCRIBE%%</p>",
        sendAt: past,
      },
    ];
    await fs.writeFile(
      path.join(shopDir, "campaigns.json"),
      JSON.stringify(campaigns, null, 2),
      "utf8",
    );

    listEventsMock.mockResolvedValue([
      { type: "email_unsubscribe", email: "leave@example.com" },
    ]);

    const { sendDueCampaigns } = await import("../scheduler");
    await sendDueCampaigns();

    expect(sendCampaignEmailMock).toHaveBeenCalledTimes(1);
    const call = sendCampaignEmailMock.mock.calls[0][0];
    expect(call.to).toBe("stay@example.com");
    expect(call.html).toContain("unsubscribe");
    expect(call.html).toContain(encodeURIComponent("stay@example.com"));
  });

  it("sends recipients in batches with delays", async () => {
    process.env.EMAIL_BATCH_SIZE = "2";
    process.env.EMAIL_BATCH_DELAY_MS = "1";
    jest.resetModules();

    const setTimeoutSpy = jest.spyOn(global, "setTimeout");

    const { sendCampaignEmail } = require("../send");
    const sendCampaignEmailMock = sendCampaignEmail as jest.Mock;
    const { setCampaignStore, fsCampaignStore } = await import("../storage");
    setCampaignStore(fsCampaignStore);
    const { createCampaign, sendDueCampaigns } = await import("../scheduler");

    const past = new Date(Date.now() - 1000).toISOString();
    const future = new Date(Date.now() + 1000).toISOString();
    const recipients = [
      "r1@example.com",
      "r2@example.com",
      "r3@example.com",
      "r4@example.com",
      "r5@example.com",
    ];
    await createCampaign({
      shop,
      recipients,
      subject: "Hi",
      body: "<p>Hi</p>",
      sendAt: future,
    });

    const file = JSON.parse(
      await fs.readFile(path.join(shopDir, "campaigns.json"), "utf8"),
    );
    file[0].sendAt = past;
    await fs.writeFile(
      path.join(shopDir, "campaigns.json"),
      JSON.stringify(file, null, 2),
      "utf8",
    );

    await sendDueCampaigns();
    expect(sendCampaignEmailMock).toHaveBeenCalledTimes(5);
    expect(setTimeoutSpy).toHaveBeenCalledTimes(2);
    expect(setTimeoutSpy).toHaveBeenNthCalledWith(
      1,
      expect.any(Function),
      1,
    );
    expect(setTimeoutSpy).toHaveBeenNthCalledWith(
      2,
      expect.any(Function),
      1,
    );

    delete process.env.EMAIL_BATCH_SIZE;
    delete process.env.EMAIL_BATCH_DELAY_MS;
  });
});
