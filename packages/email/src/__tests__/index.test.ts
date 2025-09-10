import { jest } from "@jest/globals";

const mockSendEmail = jest.fn();
const mockSyncCampaignAnalytics = jest.fn();
const mockSetCampaignStore = jest.fn();
const mockReadCampaigns = jest.fn();
const mockWriteCampaigns = jest.fn();
const mockListShops = jest.fn();

jest.mock("../sendEmail", () => ({
  sendEmail: mockSendEmail,
}));

jest.mock("../scheduler", () => ({
  syncCampaignAnalytics: mockSyncCampaignAnalytics,
}));

jest.mock("../storage", () => ({
  setCampaignStore: mockSetCampaignStore,
  fsCampaignStore: {
    readCampaigns: mockReadCampaigns,
    writeCampaigns: mockWriteCampaigns,
    listShops: mockListShops,
  },
}));

jest.mock("../templates", () => ({
  registerTemplate: jest.fn(),
  renderTemplate: jest.fn(),
  clearTemplates: jest.fn(),
}));

describe("email index", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("registers sendEmail with email service on import", async () => {
    const setEmailService = jest.fn();
    jest.doMock(
      "@acme/platform-core/services/emailService",
      () => ({ setEmailService }),
      { virtual: true },
    );

    await import("../index");

    expect(setEmailService).toHaveBeenCalledWith({ sendEmail: mockSendEmail });
  });

  it("does not throw if email service module is missing", async () => {
    jest.unmock("@acme/platform-core/services/emailService");
    try {
      // Ensure the module isn't cached so require will attempt to resolve it
      // and trigger the fallback path in the implementation when absent.
      const path = require.resolve(
        "@acme/platform-core/services/emailService",
      );
      delete require.cache[path];
    } catch {
      // Module is not resolvable in this environment which is acceptable.
    }

    await expect(import("../index")).resolves.toBeDefined();
  });

  it("re-exports public API", async () => {
    const mod = await import("../index");

    expect(mod.sendCampaignEmail).toBeDefined();
    expect(mod.registerTemplate).toBeDefined();
    expect(mod.recoverAbandonedCarts).toBeDefined();
    expect(mod.sendEmail).toBeDefined();
    expect(mod.resolveSegment).toBeDefined();
    expect(mod.createCampaign).toBeDefined();
  });

  it("forwards scheduler and storage calls", async () => {
    const store = {} as any;
    const {
      syncCampaignAnalytics,
      setCampaignStore,
      fsCampaignStore,
    } = await import("../index");

    await syncCampaignAnalytics();
    await setCampaignStore(store);
    await fsCampaignStore.readCampaigns("shop");
    await fsCampaignStore.writeCampaigns("shop", []);
    await fsCampaignStore.listShops();

    expect(mockSyncCampaignAnalytics).toHaveBeenCalled();
    expect(mockSetCampaignStore).toHaveBeenCalledWith(store);
    expect(mockReadCampaigns).toHaveBeenCalledWith("shop");
    expect(mockWriteCampaigns).toHaveBeenCalledWith("shop", []);
    expect(mockListShops).toHaveBeenCalled();
  });
});

