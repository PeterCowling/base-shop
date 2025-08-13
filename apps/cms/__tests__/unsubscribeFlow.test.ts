import { jest } from "@jest/globals";
import type { NextRequest } from "next/server";
import path from "node:path";
import { promises as fs } from "node:fs";
import { DATA_ROOT } from "@platform-core/dataRoot";

jest.mock("@platform-core/analytics", () => ({
  __esModule: true,
  trackEvent: jest.fn(),
}));

jest.mock("@acme/email", () => {
  const actual = jest.requireActual("@acme/email");
  return {
    __esModule: true,
    ...actual,
    sendCampaignEmail: jest.fn(),
  };
});
jest.mock(
  "@acme/ui",
  () => ({
    __esModule: true,
    marketingEmailTemplates: [],
  }),
  { virtual: true }
);

process.env.RESEND_API_KEY = "test";
process.env.CART_COOKIE_SECRET = "secret";
process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test";

const shop = "unsubshop";
const shopDir = path.join(DATA_ROOT, shop);

beforeEach(async () => {
  await fs.rm(shopDir, { recursive: true, force: true });
  await fs.mkdir(shopDir, { recursive: true });
  const trackEvent = (await import("@platform-core/analytics")).trackEvent as jest.Mock;
  trackEvent.mockReset();
  const { sendCampaignEmail } = await import("@acme/email");
  (sendCampaignEmail as jest.Mock).mockReset();
});

test("includes unsubscribe link when sending", async () => {
  const { POST } = await import("../src/app/api/marketing/email/route");
  const res = await POST({
    json: async () => ({
      shop,
      recipients: ["user@example.com"],
      subject: "Hi",
      body: "<p>Hello</p>",
      sendAt: new Date().toISOString(),
    }),
  } as unknown as NextRequest);
  expect(res.status).toBe(200);
  const { sendCampaignEmail } = await import("@acme/email");
  const html = (sendCampaignEmail as jest.Mock).mock.calls[0][0].html as string;
  expect(html).toContain("/api/marketing/email/unsubscribe");
  expect(html).toContain("email=user%40example.com");
});

test("records unsubscribe requests", async () => {
  const { GET } = await import(
    "../src/app/api/marketing/email/unsubscribe/route"
  );
  const req = {
    nextUrl: {
      searchParams: new URLSearchParams({
        shop,
        email: "user@example.com",
        campaign: "c1",
      }),
    },
  } as unknown as NextRequest;
  const res = await GET(req);
  expect(res.status).toBe(200);
  const trackEvent = (await import("@platform-core/analytics")).trackEvent as jest.Mock;
  expect(trackEvent).toHaveBeenCalledWith(shop, {
    type: "email_unsubscribe",
    email: "user@example.com",
    campaign: "c1",
  });
});
