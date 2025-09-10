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

  test("immediate scheduling vs delayed execution", async () => {
    await createCampaign({
      shop,
      recipients: ["a@example.com"],
      subject: "Hi",
      body: "<p>Hi</p>",
    });
    expect(mockedSend).toHaveBeenCalledTimes(1);

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

  test("resolves segment when recipients missing", async () => {
    const future = new Date(now.getTime() + 60_000).toISOString();
    mockResolveSegment.mockResolvedValue(["c@example.com"]);
    await createCampaign({
      shop,
      subject: "Hi",
      body: "<p>Hi</p>",
      segment: "all",
      sendAt: future,
    });
    expect(mockResolveSegment).toHaveBeenCalledTimes(1);
    expect(memory[shop][0].recipients).toEqual(["c@example.com"]);
  });
});
