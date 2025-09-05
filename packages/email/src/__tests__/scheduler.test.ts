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
jest.mock("@acme/lib", () => ({
  validateShopName: jest.fn((s: string) => s),
}));

import { listEvents } from "@platform-core/repositories/analytics.server";
import { sendCampaignEmail } from "../send";
import { emitSend } from "../hooks";
import { syncCampaignAnalytics as fetchCampaignAnalytics } from "../analytics";
import { resolveSegment } from "../segments";
import { renderTemplate } from "../templates";
import { validateShopName } from "@acme/lib";

const { setClock, createCampaign, sendDueCampaigns, syncCampaignAnalytics } = scheduler;

describe("scheduler", () => {
  const shop = "test-shop";
  let memory: Record<string, Campaign[]>;
  let now: Date;
  let readCampaigns: jest.Mock;
  let writeCampaigns: jest.Mock;
  let listShops: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    memory = {};
    readCampaigns = jest.fn(async (s: string) => memory[s] || []);
    writeCampaigns = jest.fn(async (s: string, items: Campaign[]) => {
      memory[s] = items;
    });
    listShops = jest.fn(async () => Object.keys(memory));
    const store: CampaignStore = { readCampaigns, writeCampaigns, listShops };
    setCampaignStore(store);
    now = new Date("2020-01-01T00:00:00Z");
    jest.setSystemTime(now);
    setClock({ now: () => new Date() });
    (listEvents as jest.Mock).mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
    delete process.env.NEXT_PUBLIC_BASE_URL;
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
      { type: "page_view" },
      { type: "email_unsubscribe", email: "b@example.com" },
      { type: "signup", email: "c@example.com" },
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

  test("trackedBody includes base URL for pixel and click tracking", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://base.example";
    await createCampaign({
      shop,
      recipients: ["a@example.com"],
      subject: "Hi",
      body: '<p><a href="https://dest">Go</a> %%UNSUBSCRIBE%%</p>',
    });
    const html = (sendCampaignEmail as jest.Mock).mock.calls[0][0]
      .html as string;
    expect(html).toContain(
      'src="https://base.example/api/marketing/email/open?shop=test-shop',
    );
    expect(html).toContain(
      'href="https://base.example/api/marketing/email/click?shop=test-shop',
    );
    expect(html).not.toContain('href="https://dest"');
  });

  test("deliverCampaign validates shop name", async () => {
    await createCampaign({
      shop,
      recipients: ["a@example.com"],
      subject: "Hi",
      body: "<p>Hi %%UNSUBSCRIBE%%</p>",
    });
    expect(validateShopName).toHaveBeenCalledTimes(2);
    expect(validateShopName).toHaveBeenNthCalledWith(1, shop);
    expect(validateShopName).toHaveBeenNthCalledWith(2, shop);
  });

  test("deliverCampaign rejects invalid shop names", async () => {
    (validateShopName as jest.Mock).mockImplementation((s: string) => {
      if (s === "bad*shop") throw new Error("invalid");
      return s;
    });
    const past = new Date(now.getTime() - 1000).toISOString();
    memory["bad*shop"] = [
      {
        id: "bad", 
        recipients: ["a@example.com"],
        subject: "Hi",
        body: "<p>Hi</p>",
        segment: null,
        sendAt: past,
        templateId: null,
      },
    ];
    await expect(sendDueCampaigns()).rejects.toThrow("invalid");
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

  test("deliverCampaign appends unsubscribe link when placeholder missing", async () => {
    await createCampaign({
      shop,
      recipients: ["a@example.com"],
      subject: "Hello",
      body: "<p>Hello world</p>",
    });
    const html = (sendCampaignEmail as jest.Mock).mock.calls[0][0].html as string;
    expect(html).toContain("<p><a href=");
    expect(html).toContain("Unsubscribe</a></p>");
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
      expect(emitSend).toHaveBeenCalledTimes(recipients.length);
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

  test("createCampaign writes campaign to store", async () => {
    await createCampaign({
      shop,
      recipients: ["a@example.com"],
      subject: "Hi",
      body: "<p>Hi</p>",
    });
    expect(readCampaigns).toHaveBeenCalledWith(shop);
    expect(writeCampaigns).toHaveBeenCalledWith(shop, memory[shop]);
  });

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
    const campaign = memory[shop].find((c) => c.id === id)!;
    expect(campaign.recipients).toEqual(["seg@example.com"]);
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

  test("deliverCampaign sets sentAt from injected clock", async () => {
    const fake = new Date("2020-02-02T00:00:00Z");
    setClock({ now: () => fake });
    await createCampaign({
      shop,
      recipients: ["a@example.com"],
      subject: "Hi",
      body: "<p>Hi</p>",
    });
    const campaign = memory[shop][0];
    expect(campaign.sentAt).toBe(fake.toISOString());
  });

  test("sendDueCampaigns delivers due campaigns per shop", async () => {
    const past = new Date(now.getTime() - 1000).toISOString();
    const future = new Date(now.getTime() + 60000).toISOString();
    memory["shopA"] = [
      {
        id: "a1",
        recipients: ["a1@example.com"],
        subject: "A1",
        body: "<p>Hi %%UNSUBSCRIBE%%</p>",
        segment: null,
        sendAt: past,
        templateId: null,
      },
      {
        id: "a2",
        recipients: ["a2@example.com"],
        subject: "A2",
        body: "<p>Hi %%UNSUBSCRIBE%%</p>",
        segment: null,
        sendAt: future,
        templateId: null,
      },
    ];
    memory["shopB"] = [
      {
        id: "b1",
        recipients: ["b1@example.com"],
        subject: "B1",
        body: "<p>Hi %%UNSUBSCRIBE%%</p>",
        segment: null,
        sendAt: past,
        templateId: null,
      },
    ];
    await sendDueCampaigns();
    expect(sendCampaignEmail).toHaveBeenCalledTimes(2);
    expect(writeCampaigns).toHaveBeenCalledTimes(2);
    expect(writeCampaigns).toHaveBeenCalledWith("shopA", memory["shopA"]);
    expect(writeCampaigns).toHaveBeenCalledWith("shopB", memory["shopB"]);
    expect(memory["shopA"][0].sentAt).toBeDefined();
    expect(memory["shopA"][1].sentAt).toBeUndefined();
    expect(memory["shopB"][0].sentAt).toBeDefined();
  });

  test("syncCampaignAnalytics delegates to analytics module", async () => {
    await syncCampaignAnalytics();
    expect(fetchCampaignAnalytics).toHaveBeenCalled();
  });

  test('createCampaign propagates send errors', async () => {
    (sendCampaignEmail as jest.Mock).mockRejectedValueOnce(new Error('boom'));
    await expect(
      createCampaign({
        shop,
        recipients: ['a@example.com'],
        subject: 'Hi',
        body: '<p>Hi</p>',
      })
    ).rejects.toThrow('boom');
  });
});

