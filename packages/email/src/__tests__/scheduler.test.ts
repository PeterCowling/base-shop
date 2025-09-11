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
    delete process.env.NEXT_PUBLIC_BASE_URL;
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
    delete process.env.EMAIL_BATCH_SIZE;
    delete process.env.EMAIL_BATCH_DELAY_MS;
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

  test("trackedBody rewrites links and appends tracking pixel", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://base.test";
    await createCampaign({
      shop,
      recipients: ["a@example.com"],
      subject: "Hi",
      body: '<a href="https://example.com/a">A</a><a href="/b">B</a>',
    });
    const html = (sendCampaignEmail as jest.Mock).mock.calls[0][0].html;
    expect(html).toContain('url=https%3A%2F%2Fexample.com%2Fa');
    expect(html).toContain('url=%2Fb');
    expect(html).toContain(
      '/api/marketing/email/open?shop=test-shop&campaign='
    );
    expect(
      (html.match(/<a href="https:\/\/base.test\/api\/marketing\/email\/click/g) || [])
        .length,
    ).toBe(2);
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
      // non-string email should be ignored
      { type: "email_unsubscribe", email: 123 as any },
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

  test("filterUnsubscribed keeps recipients when event email is not a string", async () => {
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
    (listEvents as jest.Mock).mockResolvedValue([
      { type: "email_unsubscribe", email: 123 as any },
    ]);
    await sendDueCampaigns();
    expect(sendCampaignEmail).toHaveBeenCalledTimes(2);
    expect((sendCampaignEmail as jest.Mock).mock.calls.map((c) => c[0].to)).toEqual([
      "a@example.com",
      "b@example.com",
    ]);
  });

  test("executes campaign after advancing time", async () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    memory[shop] = [
      {
        id: "c2",
        recipients: ["a@example.com"],
        subject: "Hi",
        body: "<p>Hi</p>",
        segment: null,
        sendAt: future,
        templateId: null,
      },
    ];

    await sendDueCampaigns();
    expect(sendCampaignEmail).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(60_000);
    await sendDueCampaigns();
    expect(sendCampaignEmail).toHaveBeenCalledTimes(1);
  });

  test(
    "sendDueCampaigns marks campaign sent when all recipients unsubscribed",
    async () => {
      const past = new Date(now.getTime() - 1000).toISOString();
      memory[shop] = [
        {
          id: "c2",
          recipients: ["a@example.com"],
          subject: "Hi",
          body: "<p>Hi %%UNSUBSCRIBE%%</p>",
          segment: null,
          sendAt: past,
          templateId: null,
        },
      ];
      (listEvents as jest.Mock).mockResolvedValue([
        { type: "email_unsubscribe", email: "a@example.com" },
      ]);
      await sendDueCampaigns();
      expect(sendCampaignEmail).not.toHaveBeenCalled();
      expect(memory[shop][0].sentAt).toBeDefined();
    },
  );

  test(
    "createCampaign filters unsubscribed recipients using analytics events",
    async () => {
      (listEvents as jest.Mock).mockResolvedValueOnce([
        { type: "email_unsubscribe", email: "b@example.com" },
      ]);
      await createCampaign({
        shop,
        recipients: ["a@example.com", "b@example.com"],
        subject: "Hi",
        body: "<p>Hi %%UNSUBSCRIBE%%</p>",
      });
      expect(listEvents).toHaveBeenCalledWith(shop);
      expect(sendCampaignEmail).toHaveBeenCalledTimes(1);
      const { to, html } = (sendCampaignEmail as jest.Mock).mock.calls[0][0];
      expect(to).toBe("a@example.com");
      expect(html).toContain("Unsubscribe");
      expect(html).not.toContain("%%UNSUBSCRIBE%%");
    },
  );

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
    const match = html.match(/href="([^"]+)">Unsubscribe<\/a>/);
    expect(match?.[1]).toMatch(/^\/api\/marketing\/email\/unsubscribe/);
    expect(emitSend).toHaveBeenCalledWith(shop, { campaign: expect.any(String) });
  });

  test("trackedBody rewrites anchor href for click tracking", async () => {
    await createCampaign({
      shop,
      recipients: ["a@example.com"],
      subject: "Link",
      body: '<p><a href="https://example.com/page?x=1&y=2">Link</a> %%UNSUBSCRIBE%%</p>',
    });
    const html = (sendCampaignEmail as jest.Mock).mock.calls[0][0].html as string;
    expect(html).toContain(
      "/api/marketing/email/click?shop=test-shop&campaign=",
    );
    expect(html).toContain(
      "url=https%3A%2F%2Fexample.com%2Fpage%3Fx%3D1%26y%3D2",
    );
    expect(html).not.toContain('href="https://example.com/page?x=1&y=2"');
  });

  test("trackedBody includes base URL and tracking wrappers", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://base.example";
    await createCampaign({
      shop,
      recipients: ["a@example.com"],
      subject: "Hi",
      body: '<p><a href="https://dest1">One</a><a href="https://dest2">Two</a> %%UNSUBSCRIBE%%</p>',
    });
    const html = (sendCampaignEmail as jest.Mock).mock.calls[0][0]
      .html as string;
    expect(html).toMatch(
      /<img src="https:\/\/base\.example\/api\/marketing\/email\/open\?shop=test-shop&campaign=[^&]+&t=\d+" alt="" style="display:none" width="1" height="1"\/>/,
    );
    expect(html).toContain(
      'href="https://base.example/api/marketing/email/click?shop=test-shop',
    );
    expect(html).toContain(
      'url=https%3A%2F%2Fdest1',
    );
    expect(html).toContain(
      'url=https%3A%2F%2Fdest2',
    );
    expect(html).not.toContain('href="https://dest1"');
    expect(html).not.toContain('href="https://dest2"');
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
    await expect(sendDueCampaigns()).resolves.toBeUndefined();
    expect(sendCampaignEmail).not.toHaveBeenCalled();
  });

  test("deliverCampaign renders template HTML for every recipient", async () => {
    (renderTemplate as jest.Mock).mockReturnValue("<p>Rendered</p>");
    await createCampaign({
      shop,
      recipients: ["a@example.com", "b@example.com"],
      subject: "Hello",
      body: "<p>Ignored</p>",
      templateId: "welcome",
    });
    expect(renderTemplate).toHaveBeenCalledTimes(1);
    expect(renderTemplate).toHaveBeenCalledWith("welcome", {
      subject: "Hello",
      body: "<p>Ignored</p>",
    });
    expect(sendCampaignEmail).toHaveBeenCalledTimes(2);
    (sendCampaignEmail as jest.Mock).mock.calls.forEach((c) => {
      expect((c[0].html as string)).toContain("Rendered");
    });
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

  test("createCampaign honors batch size and delay", async () => {
    process.env.EMAIL_BATCH_SIZE = "1";
    process.env.EMAIL_BATCH_DELAY_MS = "50";
    const promise = createCampaign({
      shop,
      recipients: ["a@example.com", "b@example.com"],
      subject: "Hi",
      body: "<p>Hi %%UNSUBSCRIBE%%</p>",
    });
    await jest.advanceTimersByTimeAsync(0);
    expect(sendCampaignEmail).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(49);
    expect(sendCampaignEmail).toHaveBeenCalledTimes(1);
    await jest.advanceTimersByTimeAsync(1);
    await promise;
    expect(sendCampaignEmail).toHaveBeenCalledTimes(2);
    delete process.env.EMAIL_BATCH_SIZE;
    delete process.env.EMAIL_BATCH_DELAY_MS;
  });

  test(
    "createCampaign does not schedule delay when batch delay is zero",
    async () => {
      process.env.EMAIL_BATCH_SIZE = "1";
      process.env.EMAIL_BATCH_DELAY_MS = "0";
      const setTimeoutSpy = jest.spyOn(global, "setTimeout");
      const promise = createCampaign({
        shop,
        recipients: ["a@example.com", "b@example.com"],
        subject: "Hi",
        body: "<p>Hi %%UNSUBSCRIBE%%</p>",
      });
      await jest.runAllTimersAsync();
      await promise;
      expect(setTimeoutSpy).not.toHaveBeenCalled();
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

  test("createCampaign propagates segment resolution errors", async () => {
    (resolveSegment as jest.Mock).mockRejectedValueOnce(new Error("segfail"));
    await expect(
      createCampaign({
        shop,
        segment: "bad",
        subject: "Hi",
        body: "<p>Hi</p>",
      }),
    ).rejects.toThrow("segfail");
  });

  test("deliverCampaign resolves segment once and updates recipients", async () => {
    (resolveSegment as jest.Mock).mockResolvedValue([
      "s1@example.com",
      "s2@example.com",
    ]);
    await createCampaign({
      shop,
      recipients: ["initial@example.com"],
      segment: "vip",
      subject: "Hi",
      body: "<p>Hi %%UNSUBSCRIBE%%</p>",
    });
    expect(resolveSegment).toHaveBeenCalledTimes(1);
    expect(resolveSegment).toHaveBeenCalledWith(shop, "vip");
    expect(sendCampaignEmail).toHaveBeenCalledTimes(2);
    const sentTo = (sendCampaignEmail as jest.Mock).mock.calls.map((c) => c[0].to);
    expect(sentTo).toEqual(["s1@example.com", "s2@example.com"]);
    const campaign = memory[shop][0];
    expect(campaign.recipients).toEqual(["s1@example.com", "s2@example.com"]);
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

  test("sendDueCampaigns exits early when no shops are returned", async () => {
    memory[shop] = [
      {
        id: "c1",
        recipients: ["a@example.com"],
        subject: "Hi",
        body: "<p>Hi</p>",
        segment: null,
        sendAt: new Date(now.getTime() - 1000).toISOString(),
        templateId: null,
      },
    ];

    listShops.mockResolvedValue([]);

    await sendDueCampaigns();

    expect(listShops).toHaveBeenCalled();
    expect(readCampaigns).not.toHaveBeenCalled();
    expect(writeCampaigns).not.toHaveBeenCalled();
    expect(sendCampaignEmail).not.toHaveBeenCalled();
  });

  test("sendDueCampaigns writes campaigns only when sending due items", async () => {
    const past = new Date(now.getTime() - 1000).toISOString();
    const future = new Date(now.getTime() + 60000).toISOString();
    memory[shop] = [
      {
        id: "c1",
        recipients: ["a@example.com"],
        subject: "Past",
        body: "<p>Past</p>",
        segment: null,
        sendAt: past,
        templateId: null,
      },
      {
        id: "c2",
        recipients: ["b@example.com"],
        subject: "Future",
        body: "<p>Future</p>",
        segment: null,
        sendAt: future,
        templateId: null,
      },
    ];

    await sendDueCampaigns();
    expect(writeCampaigns).toHaveBeenCalledTimes(1);

    await sendDueCampaigns();
    expect(writeCampaigns).toHaveBeenCalledTimes(1);
  });

  test("sendDueCampaigns does nothing when there are no shops", async () => {
    listShops.mockResolvedValue([]);
    await sendDueCampaigns();
    expect(sendCampaignEmail).not.toHaveBeenCalled();
    expect(writeCampaigns).not.toHaveBeenCalled();
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

  test("sendDueCampaigns skips campaigns already sent", async () => {
    const past = new Date(now.getTime() - 1000).toISOString();
    memory[shop] = [
      {
        id: "s1",
        recipients: ["s1@example.com"],
        subject: "S1",
        body: "<p>Hi</p>",
        segment: null,
        sendAt: past,
        sentAt: past,
        templateId: null,
      },
    ];
    await sendDueCampaigns();
    expect(sendCampaignEmail).not.toHaveBeenCalled();
    expect(writeCampaigns).not.toHaveBeenCalled();
  });

  test("syncCampaignAnalytics delegates to analytics module", async () => {
    await syncCampaignAnalytics();
    expect(fetchCampaignAnalytics).toHaveBeenCalled();
  });

  test('syncCampaignAnalytics handles analytics failures gracefully', async () => {
    (fetchCampaignAnalytics as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    await expect(syncCampaignAnalytics()).resolves.toBeUndefined();
    expect(fetchCampaignAnalytics).toHaveBeenCalled();
  });

  test('syncCampaignAnalytics resolves when analytics module throws', async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock('../analytics', () => ({
        __esModule: true,
        syncCampaignAnalytics: jest.fn(() => {
          throw new Error('fail');
        }),
      }));
      const { syncCampaignAnalytics } = await import('../scheduler');
      await expect(syncCampaignAnalytics()).resolves.toBeUndefined();
    });
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

  test('continues sending other recipients when some fail', async () => {
    (sendCampaignEmail as jest.Mock)
      .mockRejectedValueOnce(new Error('fail1'))
      .mockRejectedValueOnce(new Error('fail2'));
    await expect(
      createCampaign({
        shop,
        recipients: ['a@example.com', 'b@example.com'],
        subject: 'Hi',
        body: '<p>Hi</p>',
      })
    ).rejects.toThrow('Failed to send some campaign emails');
    expect(sendCampaignEmail).toHaveBeenCalledTimes(2);
  });

  test('createCampaign rejects when emitSend fails', async () => {
    (emitSend as jest.Mock).mockRejectedValueOnce(new Error('hook fail'));
    await expect(
      createCampaign({
        shop,
        recipients: ['a@example.com'],
        subject: 'Hi',
        body: '<p>Hi</p>',
      })
    ).rejects.toThrow('hook fail');
    expect(memory[shop]).toBeUndefined();
  });

  test('createCampaign rejects when segment yields no recipients', async () => {
    (resolveSegment as jest.Mock).mockResolvedValue([]);
    await expect(
      createCampaign({
        shop,
        segment: 'seg',
        subject: 'Hi',
        body: '<p>Hi</p>',
      })
    ).rejects.toThrow('Missing fields');
  });

  test("deliverCampaign batches recipients and adds unsubscribe link", async () => {
    process.env.EMAIL_BATCH_SIZE = "2";
    process.env.EMAIL_BATCH_DELAY_MS = "1000";
    process.env.NEXT_PUBLIC_BASE_URL = "https://base.test";
    const past = new Date(now.getTime() - 1000).toISOString();
    memory[shop] = [
      {
        id: "c1",
        recipients: ["a@example.com", "b@example.com", "c@example.com"],
        subject: "Hi",
        body: "<p>Hi</p>",
        segment: null,
        sendAt: past,
        templateId: null,
      },
    ];
    const p = sendDueCampaigns();
    await jest.advanceTimersByTimeAsync(0);
    expect(sendCampaignEmail).toHaveBeenCalledTimes(2);
    const html = (sendCampaignEmail as jest.Mock).mock.calls[0][0].html;
    expect(html).toContain("Unsubscribe");
    expect(html).toContain(
      "https://base.test/api/marketing/email/unsubscribe?shop=test-shop&campaign=c1&email=a%40example.com",
    );
    await jest.advanceTimersByTimeAsync(1000);
    await p;
    expect(sendCampaignEmail).toHaveBeenCalledTimes(3);
    expect(memory[shop][0].sentAt).toBeDefined();
  });

  test("deliverCampaign encodes tracking URLs with base URL", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://base.example.com";
    const shop = "shop/ü? ";
    const campaignId = "camp &aign/?";
    const recipient = "user+tag@example.com";
    const past = new Date(now.getTime() - 1000).toISOString();
    memory[shop] = [
      {
        id: campaignId,
        recipients: [recipient],
        subject: "Hi",
        body: '<a href="https://example.com/a?b=1&c=2">A</a>%%UNSUBSCRIBE%%',
        segment: null,
        sendAt: past,
        templateId: null,
      },
    ];
    await sendDueCampaigns();
    const html = (sendCampaignEmail as jest.Mock).mock.calls[0][0].html as string;
    const encodedShop = encodeURIComponent(shop);
    const encodedId = encodeURIComponent(campaignId);
    const encodedEmail = encodeURIComponent(recipient);
    const encodedUrl = encodeURIComponent("https://example.com/a?b=1&c=2");
    expect(html).toContain(
      `https://base.example.com/api/marketing/email/open?shop=${encodedShop}&campaign=${encodedId}`,
    );
    expect(html).toContain(
      `https://base.example.com/api/marketing/email/click?shop=${encodedShop}&campaign=${encodedId}&url=${encodedUrl}`,
    );
    expect(html).toContain(
      `https://base.example.com/api/marketing/email/unsubscribe?shop=${encodedShop}&campaign=${encodedId}&email=${encodedEmail}`,
    );
  });

  test("deliverCampaign encodes tracking URLs without base URL", async () => {
    const shop = "shop/ü? ";
    const campaignId = "camp &aign/?";
    const recipient = "user+tag@example.com";
    const past = new Date(now.getTime() - 1000).toISOString();
    memory[shop] = [
      {
        id: campaignId,
        recipients: [recipient],
        subject: "Hi",
        body: '<a href="https://example.com/a?b=1&c=2">A</a>%%UNSUBSCRIBE%%',
        segment: null,
        sendAt: past,
        templateId: null,
      },
    ];
    await sendDueCampaigns();
    const html = (sendCampaignEmail as jest.Mock).mock.calls[0][0].html as string;
    const encodedShop = encodeURIComponent(shop);
    const encodedId = encodeURIComponent(campaignId);
    const encodedEmail = encodeURIComponent(recipient);
    const encodedUrl = encodeURIComponent("https://example.com/a?b=1&c=2");
    expect(html).toContain(
      `/api/marketing/email/open?shop=${encodedShop}&campaign=${encodedId}`,
    );
    expect(html).toContain(
      `/api/marketing/email/click?shop=${encodedShop}&campaign=${encodedId}&url=${encodedUrl}`,
    );
    expect(html).toContain(
      `/api/marketing/email/unsubscribe?shop=${encodedShop}&campaign=${encodedId}&email=${encodedEmail}`,
    );
  });
});

