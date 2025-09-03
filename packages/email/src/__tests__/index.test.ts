import { jest } from "@jest/globals";

const mockSendEmail = jest.fn();
const mockSyncCampaignAnalytics = jest.fn();
const mockSetCampaignStore = jest.fn();
const mockReadCampaigns = jest.fn();
const mockWriteCampaigns = jest.fn();
const mockListShops = jest.fn();

jest.mock("@acme/platform-core/services/emailService", () => ({
  setEmailService: jest.fn(),
}));

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
    const { setEmailService } = require("@acme/platform-core/services/emailService");

    await import("../index");

    expect(setEmailService).toHaveBeenCalledWith({ sendEmail: mockSendEmail });
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

