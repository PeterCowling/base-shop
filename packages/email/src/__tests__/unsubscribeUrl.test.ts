import { unsubscribeUrl } from "../scheduler";

describe("unsubscribeUrl", () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
  });

  test("encodes parameters and applies base URL", () => {
    process.env.NEXT_PUBLIC_BASE_URL = "https://base.example.com";
    const shop = "shop/ü? ";
    const campaign = "camp &aign/?";
    const email = "user+tag@example.com";
    const url = unsubscribeUrl(shop, campaign, email);
    expect(url).toBe(
      `https://base.example.com/api/marketing/email/unsubscribe?shop=${encodeURIComponent(shop)}&campaign=${encodeURIComponent(campaign)}&email=${encodeURIComponent(email)}`,
    );
  });

  test("falls back to relative path when base URL is unset", () => {
    const shop = "shop";
    const campaign = "campaign";
    const email = "user@example.com";
    const url = unsubscribeUrl(shop, campaign, email);
    expect(url.startsWith("/api/marketing/email/unsubscribe")).toBe(true);
  });
});
