import { jest } from "@jest/globals";

const mockSendEmail = jest.fn();
const mockCreateCampaign = jest.fn();
const mockListCampaigns = jest.fn();
const mockSendDueCampaigns = jest.fn();
const mockSyncCampaignAnalytics = jest.fn();
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
  createCampaign: mockCreateCampaign,
  listCampaigns: mockListCampaigns,
  sendDueCampaigns: mockSendDueCampaigns,
  syncCampaignAnalytics: mockSyncCampaignAnalytics,
}));

jest.mock("../storage", () => ({
  fsCampaignStore: {
    readCampaigns: mockReadCampaigns,
    writeCampaigns: mockWriteCampaigns,
    listShops: mockListShops,
  },
}));

describe("email index", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("registers sendEmail with email service on import", async () => {
    const { setEmailService } = await import(
      "@acme/platform-core/services/emailService"
    );

    await import("../index");

    expect(setEmailService).toHaveBeenCalledWith({ sendEmail: mockSendEmail });
  });

  it("forwards scheduler calls", async () => {
    const mod = await import("../index");

    await mod.createCampaign();
    await mod.listCampaigns();
    await mod.sendDueCampaigns();
    await mod.syncCampaignAnalytics();

    expect(mockCreateCampaign).toHaveBeenCalled();
    expect(mockListCampaigns).toHaveBeenCalled();
    expect(mockSendDueCampaigns).toHaveBeenCalled();
    expect(mockSyncCampaignAnalytics).toHaveBeenCalled();
  });

  it("invokes fsCampaignStore via conditional import", async () => {
    const { fsCampaignStore } = await import("../index");

    await fsCampaignStore.readCampaigns("shop");
    await fsCampaignStore.writeCampaigns("shop", []);
    await fsCampaignStore.listShops();

    expect(mockReadCampaigns).toHaveBeenCalledWith("shop");
    expect(mockWriteCampaigns).toHaveBeenCalledWith("shop", []);
    expect(mockListShops).toHaveBeenCalled();
  });
});

