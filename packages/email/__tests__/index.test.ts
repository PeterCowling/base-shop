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

    await mod.resolveSegment("a", 1);
    expect(segments.resolveSegment).toHaveBeenCalledWith("a", 1);

    await mod.createContact("b");
    expect(segments.createContact).toHaveBeenCalledWith("b");

    await mod.addToList("list", "c");
    expect(segments.addToList).toHaveBeenCalledWith("list", "c");

    await mod.listSegments("d");
    expect(segments.listSegments).toHaveBeenCalledWith("d");

    await mod.createCampaign("e");
    expect(scheduler.createCampaign).toHaveBeenCalledWith("e");

    await mod.listCampaigns("f");
    expect(scheduler.listCampaigns).toHaveBeenCalledWith("f");

    await mod.sendDueCampaigns("g");
    expect(scheduler.sendDueCampaigns).toHaveBeenCalledWith("g");

    await mod.syncCampaignAnalytics("h");
    expect(scheduler.syncCampaignAnalytics).toHaveBeenCalledWith("h");

    await mod.setCampaignStore("i" as any);
    expect(storage.setCampaignStore).toHaveBeenCalledWith("i");

    await mod.fsCampaignStore.readCampaigns("j");
    expect(storage.fsCampaignStore.readCampaigns).toHaveBeenCalledWith("j");

    await mod.fsCampaignStore.writeCampaigns("k", 2);
    expect(storage.fsCampaignStore.writeCampaigns).toHaveBeenCalledWith("k", 2);

    await mod.fsCampaignStore.listShops("l");
    expect(storage.fsCampaignStore.listShops).toHaveBeenCalledWith("l");
  });
});
