// Mock i18n to avoid dynamic import issues (Jest hoists this above imports)
import { createCampaign } from "../scheduler";

import { sendCampaignEmail,setupTest, shop, teardown } from "./testUtils";

jest.mock("@acme/i18n/useTranslations.server", () => ({
  useTranslations: jest.fn(() =>
    Promise.resolve((key: string) => key === "email.unsubscribe" ? "Unsubscribe" : key)
  ),
}));

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

