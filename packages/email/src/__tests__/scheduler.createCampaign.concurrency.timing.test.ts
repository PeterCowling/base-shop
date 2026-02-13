// Mocks must be hoisted before scheduler imports @acme/lib and analytics.server
jest.mock("@acme/i18n/useTranslations.server", () => ({
  __esModule: true,
  useTranslations: jest.fn(() =>
    Promise.resolve((key: string) => key === "email.unsubscribe" ? "Unsubscribe" : key)
  ),
}));
jest.mock("@acme/lib", () => ({
  validateShopName: jest.fn((s: string) => s),
}));
jest.mock("@acme/platform-core/repositories/analytics.server", () => ({
  listEvents: jest.fn().mockResolvedValue([]),
}));

// eslint-disable-next-line import/first
import { createCampaign } from "../scheduler";

// eslint-disable-next-line import/first
import { sendCampaignEmail, setupTest, shop, teardown } from "./testUtils";

describe("createCampaign – real timer spacing", () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardown();
  });

  test("calls are spaced by configured delay when batch size = 1", async () => {
    // Switch to real timers to observe actual elapsed time differences.
    jest.useRealTimers();
    process.env.EMAIL_BATCH_SIZE = "1";
    process.env.EMAIL_BATCH_DELAY_MS = "10";

    const callTimes: number[] = [];
    (sendCampaignEmail as jest.Mock).mockImplementation(async () => {
      callTimes.push(Date.now());
    });

    await createCampaign({
      shop,
      recipients: ["a@example.com", "b@example.com"],
      subject: "Hi",
      body: "<p>Hi</p>",
    });

    expect(callTimes.length).toBe(2);
    expect(callTimes[1] - callTimes[0]).toBeGreaterThanOrEqual(10);
  });
});

