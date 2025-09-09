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
});
