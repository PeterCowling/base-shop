import { setCampaignStore } from "../src/storage";
import type { CampaignStore, Campaign } from "../src/storage";

jest.mock("@platform-core/repositories/analytics.server", () => ({
  __esModule: true,
  listEvents: jest.fn(),
}));

jest.mock("../src/hooks", () => ({
  __esModule: true,
  emitSend: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../src/send", () => ({
  __esModule: true,
  sendCampaignEmail: jest.fn(),
}));

jest.mock("../src/segments", () => ({
  __esModule: true,
  resolveSegment: jest.fn(),
}));

let setClock: typeof import("../src/scheduler").setClock;
let createCampaign: typeof import("../src/scheduler").createCampaign;
let sendDueCampaigns: typeof import("../src/scheduler").sendDueCampaigns;
let mockedSend: jest.Mock;
let mockListEvents: jest.Mock;
let mockResolveSegment: jest.Mock;

jest.setTimeout(10000);

describe("scheduler", () => {
  const shop = "test-shop";
  let memory: Record<string, Campaign[]>;
  let now: Date;

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.clearAllMocks();
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
    ({ setClock, createCampaign, sendDueCampaigns } = await import("../src/scheduler"));
    ({ sendCampaignEmail: mockedSend } = (await import("../src/send")) as any);
    ({ listEvents: mockListEvents } = (await import("@platform-core/repositories/analytics.server")) as any);
    ({ resolveSegment: mockResolveSegment } = (await import("../src/segments")) as any);
    setClock({ now: () => now });
    mockedSend.mockResolvedValue(undefined);
    mockListEvents.mockResolvedValue([]);
    mockResolveSegment.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
    delete process.env.EMAIL_BATCH_SIZE;
    delete process.env.EMAIL_BATCH_DELAY_MS;
  });

  test("unsubscribeUrl percent-encodes query params", async () => {
    const { unsubscribeUrl } = await import("../src/scheduler");
    const specialShop = "shop/? name";
    const specialCampaign = "camp/aign?&";
    const recipient = "user+test@example.com";
    const url = unsubscribeUrl(specialShop, specialCampaign, recipient);
    expect(url).toBe(
      `/api/marketing/email/unsubscribe?shop=${encodeURIComponent(
        specialShop,
      )}&campaign=${encodeURIComponent(
        specialCampaign,
      )}&email=${encodeURIComponent(recipient)}`,
    );
  });

  test("immediate scheduling vs delayed execution", async () => {
    await createCampaign({
      shop,
      recipients: ["a@example.com"],
      subject: "Hi",
      body: "<p>Hi</p>",
    });
    expect(mockedSend).toHaveBeenCalledTimes(1);
    expect(memory[shop][0].sentAt).toEqual(expect.any(String));

    mockedSend.mockClear();
    const future = new Date(now.getTime() + 60_000).toISOString();
    await createCampaign({
      shop,
      recipients: ["b@example.com"],
      subject: "Later",
      body: "<p>Later</p>",
      sendAt: future,
    });
    expect(mockedSend).not.toHaveBeenCalled();

    await sendDueCampaigns();
    expect(mockedSend).not.toHaveBeenCalled();

    now = new Date(now.getTime() + 60_000);
    await sendDueCampaigns();
    expect(mockedSend).toHaveBeenCalledTimes(1);
  });

  test("missing fields when no recipients and no segment", async () => {
    await expect(
      createCampaign({
        shop,
        recipients: [],
        subject: "Hi",
        body: "<p>Hi</p>",
      }),
    ).rejects.toThrow("Missing fields");
    expect(memory[shop]).toBeUndefined();
  });

  test("concurrency limit exceeded path", async () => {
    jest.useRealTimers();
    process.env.EMAIL_BATCH_SIZE = "1";
    process.env.EMAIL_BATCH_DELAY_MS = "10";
    const calls: number[] = [];
    mockedSend.mockImplementation(async () => {
      calls.push(Date.now());
    });

    await createCampaign({
      shop,
      recipients: ["a@example.com", "b@example.com"],
      subject: "Hi",
      body: "<p>Hi</p>",
    });

    expect(calls.length).toBe(2);
    expect(calls[1] - calls[0]).toBeGreaterThanOrEqual(10);
  });

  test("createCampaign replaces unsubscribe token or appends footer", async () => {
    await createCampaign({
      shop,
      recipients: ["a@example.com"],
      subject: "Hi",
      body: "<p>Hi %%UNSUBSCRIBE%%</p>",
    });
    let html = mockedSend.mock.calls[0][0].html as string;
    expect(html).toMatch(/<p>Hi <a href="[^"]+">Unsubscribe<\/a><\/p><img/);

    mockedSend.mockClear();

    await createCampaign({
      shop,
      recipients: ["b@example.com"],
      subject: "Hi",
      body: "<p>Hi</p>",
    });
    html = mockedSend.mock.calls[0][0].html as string;
    expect(html).toMatch(/<p>Hi<\/p><img[^>]*><p><a href="[^"]+">Unsubscribe<\/a><\/p>/);
  });

  test("error thrown inside job handler", async () => {
    mockedSend.mockRejectedValueOnce(new Error("boom"));

    await expect(
      createCampaign({
        shop,
        recipients: ["a@example.com"],
        subject: "Hi",
        body: "<p>Hi</p>",
      })
    ).rejects.toThrow("boom");

    expect(memory[shop]).toBeUndefined();
  });

  test("adds tracking pixel and rewrites links", async () => {
    const id = await createCampaign({
      shop,
      recipients: ["a@example.com"],
      subject: "Hi",
      body: '<p><a href="https://example.com">Link</a></p>',
    });

    expect(mockedSend).toHaveBeenCalledTimes(1);
    const html = mockedSend.mock.calls[0][0].html as string;
    expect(html).toContain(
      `/api/marketing/email/open?shop=${shop}&campaign=${id}`,
    );
    expect(html).toContain(
      `href="/api/marketing/email/click?shop=${shop}&campaign=${id}&url=${encodeURIComponent(
        "https://example.com",
      )}"`,
    );
  });

  test("resolves segment when recipients missing", async () => {
    mockResolveSegment.mockResolvedValue(["a@example.com", "b@example.com"]);

    await createCampaign({
      shop,
      recipients: [],
      segment: "all",
      subject: "Hi",
      body: "<p>Hi</p>",
    });

    expect(mockResolveSegment).toHaveBeenCalledTimes(2);
    expect(memory[shop][0].recipients).toEqual([
      "a@example.com",
      "b@example.com",
    ]);
    expect(mockedSend).toHaveBeenCalledTimes(2);
  });

  test("filters out unsubscribed recipients", async () => {
    mockListEvents.mockResolvedValueOnce([
      { type: "email_unsubscribe", email: "a@example.com" },
      // non-string email should be ignored
      { type: "email_unsubscribe", email: 123 as any },
    ]);

    await createCampaign({
      shop,
      recipients: ["a@example.com", "b@example.com"],
      subject: "Hi",
      body: "<p>Hi</p>",
    });

    expect(mockedSend).toHaveBeenCalledTimes(1);
    expect(mockedSend.mock.calls[0][0].to).toBe("b@example.com");
  });

  test("falls back to original recipients on listEvents error", async () => {
    mockListEvents.mockRejectedValueOnce(new Error("oops"));

    await createCampaign({
      shop,
      recipients: ["a@example.com", "b@example.com"],
      subject: "Hi",
      body: "<p>Hi</p>",
    });

    expect(mockedSend).toHaveBeenCalledTimes(2);
    expect(mockedSend.mock.calls.map((c) => c[0].to)).toEqual([
      "a@example.com",
      "b@example.com",
    ]);
  });

  test("syncCampaignAnalytics resolves when analytics throws", async () => {
    await jest.isolateModulesAsync(async () => {
      const mockAnalytics = jest
        .fn()
        .mockRejectedValue(new Error("fail"));
      jest.doMock("../src/analytics", () => ({
        __esModule: true,
        syncCampaignAnalytics: mockAnalytics,
      }));
      const { syncCampaignAnalytics } = await import("../src/scheduler");
      await expect(syncCampaignAnalytics()).resolves.toBeUndefined();
      expect(mockAnalytics).toHaveBeenCalled();
    });
  });
});
