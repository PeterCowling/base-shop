import { setCampaignStore } from "../storage";
import type { CampaignStore, Campaign } from "../storage";

import * as scheduler from "../scheduler";

jest.mock("@platform-core/repositories/analytics.server", () => ({
  listEvents: jest.fn(),
}));
jest.mock("../send", () => ({
  sendCampaignEmail: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../hooks", () => ({
  emitSend: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../analytics", () => ({
  syncCampaignAnalytics: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../segments", () => ({
  resolveSegment: jest.fn(),
}));
jest.mock("../templates", () => ({
  renderTemplate: jest.fn(),
}));

import { listEvents } from "@platform-core/repositories/analytics.server";
import { sendCampaignEmail } from "../send";
import { emitSend } from "../hooks";
import { syncCampaignAnalytics as fetchCampaignAnalytics } from "../analytics";
import { resolveSegment } from "../segments";
import { renderTemplate } from "../templates";

const { setClock, createCampaign, sendDueCampaigns, syncCampaignAnalytics } = scheduler;

describe("scheduler", () => {
  const shop = "test-shop";
  let memory: Record<string, Campaign[]>;
  let now: Date;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    memory = {};
    const store: CampaignStore = {
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
    setCampaignStore(store);
    now = new Date("2020-01-01T00:00:00Z");
    jest.setSystemTime(now);
    setClock({ now: () => new Date() });
    (listEvents as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("listCampaigns forwards arguments to the campaign store", async () => {
    const data: Campaign[] = [];
    const readCampaigns = jest.fn().mockResolvedValue(data);
    const getCampaignStore = jest.fn().mockReturnValue({ readCampaigns });
    await jest.isolateModulesAsync(async () => {
      jest.doMock("../storage", () => ({ __esModule: true, getCampaignStore }));
      const { listCampaigns } = await import("../scheduler");
      await expect(listCampaigns(shop)).resolves.toBe(data);
      expect(readCampaigns).toHaveBeenCalledWith(shop);
    });
  });

  test("filterUnsubscribed skips unsubscribed recipients", async () => {
    const past = new Date(now.getTime() - 1000).toISOString();
    memory[shop] = [
      {
        id: "c1",
        recipients: ["a@example.com", "b@example.com"],
        subject: "Hi",
        body: "<p>Hi %%UNSUBSCRIBE%%</p>",
        segment: null,
        sendAt: past,
        templateId: null,
      },
    ];
    (listEvents as jest.Mock).mockResolvedValue([
      { type: "email_unsubscribe", email: "b@example.com" },
    ]);
    await sendDueCampaigns();
    expect(listEvents).toHaveBeenCalledWith(shop);
    expect(sendCampaignEmail).toHaveBeenCalledTimes(1);
    const { to, html } = (sendCampaignEmail as jest.Mock).mock.calls[0][0];
    expect(to).toBe("a@example.com");
    expect(html).toContain("Unsubscribe");
    expect(html).not.toContain("%%UNSUBSCRIBE%%");
  });

  test("filterUnsubscribed returns original list on error", async () => {
    const past = new Date(now.getTime() - 1000).toISOString();
    memory[shop] = [
      {
        id: "c1",
        recipients: ["a@example.com", "b@example.com"],
        subject: "Hi",
        body: "<p>Hi</p>",
        segment: null,
        sendAt: past,
        templateId: null,
      },
    ];
    (listEvents as jest.Mock).mockRejectedValue(new Error("fail"));
    await sendDueCampaigns();
    expect(sendCampaignEmail).toHaveBeenCalledTimes(2);
    expect((sendCampaignEmail as jest.Mock).mock.calls.map((c) => c[0].to)).toEqual([
      "a@example.com",
      "b@example.com",
    ]);
  });

  test("deliverCampaign inserts tracking pixel and unsubscribe link", async () => {
    await createCampaign({
      shop,
      recipients: ["a@example.com"],
      subject: "Hello",
      body: "<p>Hi %%UNSUBSCRIBE%%</p>",
    });
    const html = (sendCampaignEmail as jest.Mock).mock.calls[0][0].html as string;
    expect(html).toMatch(/open\?shop=test-shop&campaign=.*&t=\d+/);
    expect(html).toContain("Unsubscribe");
    expect(html).toContain(encodeURIComponent("a@example.com"));
    expect(emitSend).toHaveBeenCalledWith(shop, { campaign: expect.any(String) });
  });

  test("trackedBody rewrites anchor href for click tracking", async () => {
    await createCampaign({
      shop,
      recipients: ["a@example.com"],
      subject: "Link",
      body: '<p><a href="https://example.com/page">Link</a> %%UNSUBSCRIBE%%</p>',
    });
    const html = (sendCampaignEmail as jest.Mock).mock.calls[0][0].html as string;
    expect(html).toContain(
      "/api/marketing/email/click?shop=test-shop&campaign=",
    );
    expect(html).toContain(
      "url=https%3A%2F%2Fexample.com%2Fpage",
    );
    expect(html).not.toContain('href="https://example.com/page"');
  });

  test("deliverCampaign renders templates when templateId provided", async () => {
    (renderTemplate as jest.Mock).mockReturnValue("<p>Rendered</p>");
    await createCampaign({
      shop,
      recipients: ["a@example.com"],
      subject: "Hello",
      body: "<p>Ignored</p>",
      templateId: "welcome",
    });
    expect(renderTemplate).toHaveBeenCalledWith("welcome", {
      subject: "Hello",
      body: "<p>Ignored</p>",
    });
    const html = (sendCampaignEmail as jest.Mock).mock.calls[0][0].html as string;
    expect(html).toContain("Rendered");
  });

  test(
    "deliverCampaign batches recipients and adds unsubscribe links",
    async () => {
      process.env.EMAIL_BATCH_SIZE = "2";
      process.env.EMAIL_BATCH_DELAY_MS = "10";
      const setTimeoutSpy = jest.spyOn(global, "setTimeout");
      const recipients = [
        "a@example.com",
        "b@example.com",
        "c@example.com",
      ];
      const promise = createCampaign({
        shop,
        recipients,
        subject: "Hello",
        body: "<p>Hi %%UNSUBSCRIBE%%</p>",
      });
      // Run all scheduled timers, including those added during execution.
      await jest.runAllTimersAsync();
      await promise;
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 10);
      expect(sendCampaignEmail).toHaveBeenCalledTimes(recipients.length);
      recipients.forEach((r, i) => {
        const html = (sendCampaignEmail as jest.Mock).mock.calls[i][0]
          .html as string;
        expect(html).toContain("Unsubscribe");
        expect(html).toContain(encodeURIComponent(r));
      });
      setTimeoutSpy.mockRestore();
      delete process.env.EMAIL_BATCH_SIZE;
      delete process.env.EMAIL_BATCH_DELAY_MS;
    },
    10000,
  );

  test("createCampaign resolves recipients from segment without explicit recipients", async () => {
    (resolveSegment as jest.Mock).mockResolvedValue(["seg@example.com"]);
    const id = await createCampaign({
      shop,
      segment: "test",
      subject: "Hi",
      body: "<p>Hi</p>",
    });
    expect(resolveSegment).toHaveBeenCalledWith(shop, "test");
    expect(sendCampaignEmail).toHaveBeenCalledWith({
      to: "seg@example.com",
      subject: "Hi",
      html: expect.any(String),
    });
    expect(typeof id).toBe("string");
  });

  test("createCampaign throws when required fields are missing", async () => {
    await expect(
      createCampaign({
        shop,
        recipients: ["a@example.com"],
        body: "<p>Hi</p>",
      } as any),
    ).rejects.toThrow("Missing fields");
    await expect(
      createCampaign({
        shop,
        recipients: ["a@example.com"],
        subject: "Hi",
      } as any),
    ).rejects.toThrow("Missing fields");
    await expect(
      createCampaign({
        shop,
        subject: "Hi",
        body: "<p>Hi</p>",
        recipients: [],
      }),
    ).rejects.toThrow("Missing fields");
  });

  test("createCampaign handles past and future sendAt", async () => {
    const past = new Date(Date.now() - 1000).toISOString();
    const idPast = await createCampaign({
      shop,
      recipients: ["past@example.com"],
      subject: "Past",
      body: "<p>Past</p>",
      sendAt: past,
    });
    expect(sendCampaignEmail).toHaveBeenCalledTimes(1);
    const sentPast = memory[shop].find((c) => c.id === idPast)!;
    expect(sentPast.sentAt).toBe(new Date().toISOString());

    const futureDate = new Date(Date.now() + 60000);
    const future = futureDate.toISOString();
    await createCampaign({
      shop,
      recipients: ["future@example.com"],
      subject: "Future",
      body: "<p>Future</p>",
      sendAt: future,
    });
    expect(sendCampaignEmail).toHaveBeenCalledTimes(1);
    await sendDueCampaigns();
    expect(sendCampaignEmail).toHaveBeenCalledTimes(1);
    jest.setSystemTime(futureDate);
    await sendDueCampaigns();
    expect(sendCampaignEmail).toHaveBeenCalledTimes(2);
    await sendDueCampaigns();
    expect(sendCampaignEmail).toHaveBeenCalledTimes(2);
  });

  test("syncCampaignAnalytics delegates to analytics module", async () => {
    await syncCampaignAnalytics();
    expect(fetchCampaignAnalytics).toHaveBeenCalled();
  });
});

