// Mock i18n to avoid dynamic import issues (Jest hoists this above imports)
jest.mock("@acme/i18n/useTranslations.server", () => ({
  useTranslations: jest.fn(() =>
    Promise.resolve((key: string) => key === "email.unsubscribe" ? "Unsubscribe" : key)
  ),
}));

import { setupTest, teardown, shop, sendCampaignEmail } from "./testUtils";
import { sendDueCampaigns } from "../scheduler";

describe("sendDueCampaigns – batching and tracking URLs", () => {
  let ctx: ReturnType<typeof setupTest>;

  beforeEach(() => {
    ctx = setupTest();
  });

  afterEach(() => {
    teardown();
  });

  test(
    "deliverCampaign batches recipients and adds unsubscribe link",
    async () => {
      process.env.EMAIL_BATCH_SIZE = "2";
      process.env.EMAIL_BATCH_DELAY_MS = "1000";
      process.env.NEXT_PUBLIC_BASE_URL = "https://base.test";
      const past = new Date(ctx.now.getTime() - 1000).toISOString();
      ctx.memory[shop] = [
        {
          id: "c1",
          recipients: ["a@example.com", "b@example.com", "c@example.com"],
          subject: "Hi",
          body: "<p>Hi</p>",
          segment: null,
          sendAt: past,
          templateId: null,
        },
      ];
      const p = sendDueCampaigns();
      await jest.advanceTimersByTimeAsync(0);
      expect(sendCampaignEmail).toHaveBeenCalledTimes(2);
      const html = (sendCampaignEmail as jest.Mock).mock.calls[0][0].html;
      expect(html).toContain("Unsubscribe");
      expect(html).toContain(
        "https://base.test/api/marketing/email/unsubscribe?shop=test-shop&campaign=c1&email=a%40example.com",
      );
      await jest.advanceTimersByTimeAsync(1000);
      await p;
      expect(sendCampaignEmail).toHaveBeenCalledTimes(3);
      expect(ctx.memory[shop][0].sentAt).toBeDefined();
    },
  );

  test("deliverCampaign encodes tracking URLs with base URL", async () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://base.example.com";
    const s = "shop/ü? ";
    const campaignId = "camp &aign/?";
    const recipient = "user+tag@example.com";
    const past = new Date(ctx.now.getTime() - 1000).toISOString();
    ctx.memory[s] = [
      {
        id: campaignId,
        recipients: [recipient],
        subject: "Hi",
        body: '<a href="https://example.com/a?b=1&c=2">A</a>%%UNSUBSCRIBE%%',
        segment: null,
        sendAt: past,
        templateId: null,
      },
    ];
    await sendDueCampaigns();
    const html = (sendCampaignEmail as jest.Mock).mock.calls[0][0].html as string;
    const encodedShop = encodeURIComponent(s);
    const encodedId = encodeURIComponent(campaignId);
    const encodedEmail = encodeURIComponent(recipient);
    const encodedUrl = encodeURIComponent("https://example.com/a?b=1&c=2");
    expect(html).toContain(
      `https://base.example.com/api/marketing/email/open?shop=${encodedShop}&campaign=${encodedId}`,
    );
    expect(html).toContain(
      `https://base.example.com/api/marketing/email/click?shop=${encodedShop}&campaign=${encodedId}&url=${encodedUrl}`,
    );
    expect(html).toContain(
      `https://base.example.com/api/marketing/email/unsubscribe?shop=${encodedShop}&campaign=${encodedId}&email=${encodedEmail}`,
    );
  });

  test("deliverCampaign encodes tracking URLs without base URL", async () => {
    const s = "shop/ü? ";
    const campaignId = "camp &aign/?";
    const recipient = "user+tag@example.com";
    const past = new Date(ctx.now.getTime() - 1000).toISOString();
    ctx.memory[s] = [
      {
        id: campaignId,
        recipients: [recipient],
        subject: "Hi",
        body: '<a href="https://example.com/a?b=1&c=2">A</a>%%UNSUBSCRIBE%%',
        segment: null,
        sendAt: past,
        templateId: null,
      },
    ];
    await sendDueCampaigns();
    const html = (sendCampaignEmail as jest.Mock).mock.calls[0][0].html as string;
    const encodedShop = encodeURIComponent(s);
    const encodedId = encodeURIComponent(campaignId);
    const encodedEmail = encodeURIComponent(recipient);
    const encodedUrl = encodeURIComponent("https://example.com/a?b=1&c=2");
    expect(html).toContain(
      `/api/marketing/email/open?shop=${encodedShop}&campaign=${encodedId}`,
    );
    expect(html).toContain(
      `/api/marketing/email/click?shop=${encodedShop}&campaign=${encodedId}&url=${encodedUrl}`,
    );
    expect(html).toContain(
      `/api/marketing/email/unsubscribe?shop=${encodedShop}&campaign=${encodedId}&email=${encodedEmail}`,
    );
  });
});

