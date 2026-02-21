import type { CampaignStore } from "../src/storage";

// Email service injection test

describe("email package entry point", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("injects sendEmail into platform core service", async () => {
    const setEmailService = jest.fn();
    jest.doMock("@acme/platform-core/email", () => ({
      setEmailService,
    }));

    await import("../src/index");

    const { sendEmail } = await import("../src/sendEmail");
    expect(setEmailService).toHaveBeenCalledWith({ sendEmail });
  });

  it("forwards to dynamically imported modules", async () => {
    const segments = {
      resolveSegment: jest.fn(),
      createContact: jest.fn(),
      addToList: jest.fn(),
      listSegments: jest.fn(),
    };
    const scheduler = {
      createCampaign: jest.fn(),
      listCampaigns: jest.fn(),
      sendDueCampaigns: jest.fn(),
      syncCampaignAnalytics: jest.fn(),
    };
    const storage = {
      setCampaignStore: jest.fn(),
      fsCampaignStore: {
        readCampaigns: jest.fn(),
        writeCampaigns: jest.fn(),
        listShops: jest.fn(),
      },
    } as unknown as {
      setCampaignStore: jest.Mock;
      fsCampaignStore: CampaignStore;
    };
    jest.doMock("../src/segments", () => segments);
    jest.doMock("../src/scheduler", () => scheduler);
    jest.doMock("../src/storage", () => storage);

    const mod = await import("../src/index");

    await mod.resolveSegment("a", 1 as any);
    expect(segments.resolveSegment).toHaveBeenCalledWith("a", 1);

    await (mod.createContact as any)("b");
    expect(segments.createContact).toHaveBeenCalledWith("b");

    await mod.addToList("list", "c" as any);
    expect(segments.addToList).toHaveBeenCalledWith("list", "c");

    await (mod.listSegments as any)("d");
    expect(segments.listSegments).toHaveBeenCalledWith("d");

    await (mod.createCampaign as any)("e");
    expect(scheduler.createCampaign).toHaveBeenCalledWith("e");

    await mod.listCampaigns("f");
    expect(scheduler.listCampaigns).toHaveBeenCalledWith("f");

    await (mod.sendDueCampaigns as any)("g");
    expect(scheduler.sendDueCampaigns).toHaveBeenCalledWith("g");

    await (mod.syncCampaignAnalytics as any)("h");
    expect(scheduler.syncCampaignAnalytics).toHaveBeenCalledWith("h");

    await mod.setCampaignStore("i" as any);
    expect(storage.setCampaignStore).toHaveBeenCalledWith("i");

    await mod.fsCampaignStore.readCampaigns("j");
    expect(storage.fsCampaignStore.readCampaigns).toHaveBeenCalledWith("j");

    await mod.fsCampaignStore.writeCampaigns("k", 2 as any);
    expect(storage.fsCampaignStore.writeCampaigns).toHaveBeenCalledWith("k", 2);

    await (mod.fsCampaignStore.listShops as any)("l");
    expect(storage.fsCampaignStore.listShops).toHaveBeenCalledWith("l");
  });
});
