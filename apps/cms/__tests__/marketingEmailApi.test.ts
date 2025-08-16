import { jest } from "@jest/globals";
import type { NextRequest } from "next/server";
import path from "node:path";
import { promises as fs } from "node:fs";
import { DATA_ROOT } from "@platform-core/dataRoot";
import { setMarketingEmailTemplates } from "@acme/email";

jest.doMock("@platform-core/analytics", () => ({
  __esModule: true,
  trackEvent: jest.fn(),
}));

process.env.CART_COOKIE_SECRET = "secret";
process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test";
process.env.STRIPE_WEBHOOK_SECRET = "whsec";
process.env.RESEND_API_KEY = "re_test";

setMarketingEmailTemplates([]);

const ResponseWithJson = Response as unknown as typeof Response & {
  json?: (data: unknown, init?: ResponseInit) => Response;
};
if (typeof ResponseWithJson.json !== "function") {
  ResponseWithJson.json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

describe("marketing email API segments", () => {
  const shop = "segshop";
  const shopDir = path.join(DATA_ROOT, shop);

  beforeEach(async () => {
    await fs.rm(shopDir, { recursive: true, force: true });
    await fs.mkdir(shopDir, { recursive: true });
  });

  test("resolves recipients from segment when list empty", async () => {
    await fs.writeFile(
      path.join(shopDir, "segments.json"),
      JSON.stringify([
        { id: "vip", name: "VIP", filters: [{ field: "type", value: "purchase" }] },
      ]),
      "utf8"
    );
    await fs.writeFile(
      path.join(shopDir, "analytics.jsonl"),
      JSON.stringify({ type: "purchase", email: "a@example.com" }) + "\n" +
        JSON.stringify({ type: "purchase", email: "b@example.com" }) + "\n",
      "utf8"
    );

    const { POST } = await import("../src/app/api/marketing/email/route");

    const res = await POST({
      json: async () => ({
        shop,
        recipients: [],
        subject: "Hello",
        body: "<p>Hi</p>",
        segment: "vip",
        sendAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      }),
    } as unknown as NextRequest);

    expect(res.status).toBe(200);
    const campaigns = JSON.parse(
      await fs.readFile(path.join(shopDir, "campaigns.json"), "utf8")
    );
    expect(campaigns[0].recipients.sort()).toEqual(
      ["a@example.com", "b@example.com"].sort()
    );
  });

  test("falls back to manual recipients when provided", async () => {
    await fs.writeFile(path.join(shopDir, "analytics.jsonl"), "", "utf8");

    const { POST } = await import("../src/app/api/marketing/email/route");

    const res = await POST({
      json: async () => ({
        shop,
        recipients: ["manual@example.com"],
        subject: "Hello",
        body: "<p>Hi</p>",
        segment: "vip",
        sendAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      }),
    } as unknown as NextRequest);

    expect(res.status).toBe(200);
    const campaigns = JSON.parse(
      await fs.readFile(path.join(shopDir, "campaigns.json"), "utf8")
    );
    expect(campaigns[0].recipients).toEqual(["manual@example.com"]);
  });
});
