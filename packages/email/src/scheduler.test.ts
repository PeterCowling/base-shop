import { ProviderError } from "./providers/types";
import type { Campaign } from "./types";

let mockSendgridSend: jest.Mock;
let mockSendMail: jest.Mock;
const mockEmitSend = jest.fn();
const campaignsByShop: Record<string, Campaign[]> = {};

const mockStore = {
  listShops: jest.fn(async () => Object.keys(campaignsByShop)),
  readCampaigns: jest.fn(async (shop: string) => campaignsByShop[shop] || []),
  writeCampaigns: jest.fn(async (shop: string, campaigns: Campaign[]) => {
    campaignsByShop[shop] = campaigns;
  }),
};

jest.mock("./storage", () => ({ getCampaignStore: () => mockStore }));
jest.mock("./hooks", () => ({ emitSend: (...args: any[]) => mockEmitSend(...args) }));
jest.mock("@platform-core/repositories/analytics.server", () => ({
  listEvents: jest.fn().mockResolvedValue([]),
}));
jest.mock("@acme/lib", () => ({ validateShopName: (s: string) => s }));

jest.mock("./providers/sendgrid", () => ({
  SendgridProvider: jest
    .fn()
    .mockImplementation(() => ({ send: (...args: any[]) => mockSendgridSend(...args) })),
}));
jest.mock("./providers/resend", () => ({
  ResendProvider: jest.fn().mockImplementation(() => ({ send: jest.fn() })),
}));
jest.mock("nodemailer", () => ({
  __esModule: true,
  default: {
    createTransport: () => ({
      sendMail: (...args: any[]) => mockSendMail(...args),
    }),
  },
}));

const coreEnvMock = {
  NEXT_PUBLIC_BASE_URL: "",
  EMAIL_BATCH_SIZE: 100,
  EMAIL_BATCH_DELAY_MS: 0,
  EMAIL_PROVIDER: "sendgrid",
  SENDGRID_API_KEY: "sg",
  RESEND_API_KEY: undefined as string | undefined,
  CAMPAIGN_FROM: "campaign@example.com",
  SMTP_URL: "smtp://localhost",
};
jest.mock("@acme/config/env/core", () => ({ coreEnv: coreEnvMock }));

describe("sendDueCampaigns retry logic", () => {
  const setupEnv = () => {
    process.env.EMAIL_PROVIDER = "sendgrid";
    process.env.SENDGRID_API_KEY = "sg";
    delete process.env.RESEND_API_KEY;
    process.env.CAMPAIGN_FROM = "campaign@example.com";
    mockSendMail = jest.fn();
  };

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    setupEnv();
    for (const key of Object.keys(campaignsByShop)) delete campaignsByShop[key];
    jest.setTimeout(10000);
  });

  afterEach(() => {
    delete process.env.EMAIL_PROVIDER;
    delete process.env.SENDGRID_API_KEY;
    delete process.env.CAMPAIGN_FROM;
  });

  function createCampaign(now: Date): Campaign {
    return {
      id: "cmp1",
      recipients: ["to@example.com"],
      subject: "Subject",
      body: "<p>HTML</p>",
      segment: null,
      sendAt: now.toISOString(),
      templateId: null,
    };
  }

  it("retries with exponential backoff and drains queue", async () => {
    const { sendDueCampaigns, setClock } = await import("./scheduler");
    const now = new Date("2024-01-01T00:00:00Z");
    setClock({ now: () => now });
    campaignsByShop.shop = [createCampaign(now)];
    mockSendgridSend = jest
      .fn()
      .mockRejectedValueOnce(new ProviderError("temp", true))
      .mockRejectedValueOnce(new ProviderError("temp2", true))
      .mockResolvedValueOnce(undefined);

    const timeoutSpy = jest.spyOn(global, "setTimeout");
    await sendDueCampaigns();

    expect(mockSendgridSend).toHaveBeenCalledTimes(3);
    expect(timeoutSpy.mock.calls).toEqual(
      expect.arrayContaining([
        [expect.any(Function), 100],
        [expect.any(Function), 200],
      ]),
    );
    expect(mockStore.writeCampaigns).toHaveBeenCalled();
    expect(campaignsByShop.shop[0].sentAt).toBe(now.toISOString());
    timeoutSpy.mockRestore();
  });

  it("respects retry limit on persistent failures", async () => {
    const { sendDueCampaigns, setClock } = await import("./scheduler");
    const now = new Date("2024-01-01T00:00:00Z");
    setClock({ now: () => now });
    campaignsByShop.shop = [createCampaign(now)];
    mockSendgridSend = jest.fn().mockRejectedValue(new ProviderError("fail", true));
    mockSendMail = jest.fn().mockRejectedValue(new Error("smtp fail"));

    const timeoutSpy = jest.spyOn(global, "setTimeout");
    await expect(sendDueCampaigns()).rejects.toThrow();

    expect(mockSendgridSend).toHaveBeenCalledTimes(3);
    expect(timeoutSpy.mock.calls).toEqual(
      expect.arrayContaining([
        [expect.any(Function), 100],
        [expect.any(Function), 200],
      ]),
    );
    expect(mockStore.writeCampaigns).not.toHaveBeenCalled();
    timeoutSpy.mockRestore();
  });

  it("bubbles non-retryable errors immediately", async () => {
    const { sendDueCampaigns, setClock } = await import("./scheduler");
    const now = new Date("2024-01-01T00:00:00Z");
    setClock({ now: () => now });
    campaignsByShop.shop = [createCampaign(now)];
    mockSendgridSend = jest.fn().mockRejectedValue(new ProviderError("fatal", false));
    mockSendMail = jest.fn().mockRejectedValue(new Error("smtp fail"));

    const timeoutSpy = jest.spyOn(global, "setTimeout");
    await expect(sendDueCampaigns()).rejects.toThrow();

    expect(mockSendgridSend).toHaveBeenCalledTimes(1);
    expect(timeoutSpy).not.toHaveBeenCalled();
    expect(mockStore.writeCampaigns).not.toHaveBeenCalled();
    timeoutSpy.mockRestore();
  });
});

