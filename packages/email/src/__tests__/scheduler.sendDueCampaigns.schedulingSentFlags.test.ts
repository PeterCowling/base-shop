// Mock i18n to avoid dynamic import issues (Jest hoists this above imports)
jest.mock("@acme/i18n/useTranslations.server", () => ({
  useTranslations: jest.fn(() =>
    Promise.resolve((key: string) => key === "email.unsubscribe" ? "Unsubscribe" : key)
  ),
}));

import { setupTest, teardown, shop, sendCampaignEmail, listEvents } from "./testUtils";
import { sendDueCampaigns } from "../scheduler";

describe("sendDueCampaigns – scheduling and sent flags", () => {
  let ctx: ReturnType<typeof setupTest>;

  beforeEach(() => {
    ctx = setupTest();
  });

  afterEach(() => {
    teardown();
  });

  test("executes campaign after advancing time", async () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    ctx.memory[shop] = [
      {
        id: "c2",
        recipients: ["a@example.com"],
        subject: "Hi",
        body: "<p>Hi</p>",
        segment: null,
        sendAt: future,
        templateId: null,
      },
    ];

    await sendDueCampaigns();
    expect(sendCampaignEmail).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(60_000);
    await sendDueCampaigns();
    expect(sendCampaignEmail).toHaveBeenCalledTimes(1);
  });

  test(
    "sendDueCampaigns marks campaign sent when all recipients unsubscribed",
    async () => {
      const past = new Date(ctx.now.getTime() - 1000).toISOString();
      ctx.memory[shop] = [
        {
          id: "c2",
          recipients: ["a@example.com"],
          subject: "Hi",
          body: "<p>Hi %%UNSUBSCRIBE%%</p>",
          segment: null,
          sendAt: past,
          templateId: null,
        },
      ];
      (listEvents as jest.Mock).mockResolvedValue([
        { type: "email_unsubscribe", email: "a@example.com" },
      ]);
      await sendDueCampaigns();
      expect(sendCampaignEmail).not.toHaveBeenCalled();
      expect(ctx.memory[shop][0].sentAt).toBeDefined();
    },
  );
});

