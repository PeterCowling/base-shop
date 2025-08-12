import type { NextRequest } from "next/server";
import crypto from "node:crypto";

process.env.CART_COOKIE_SECRET = "secret";

jest.mock("@platform-core/analytics", () => ({
  __esModule: true,
  trackEvent: jest.fn(),
}));

const ResponseWithJson = Response as unknown as typeof Response & {
  json?: (data: unknown, init?: ResponseInit) => Response;
};
if (typeof ResponseWithJson.json !== "function") {
  ResponseWithJson.json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

describe("email provider webhooks", () => {
  const shop = "webhook-shop";
  let trackEvent: jest.Mock;

  beforeEach(() => {
    trackEvent = require("@platform-core/analytics").trackEvent as jest.Mock;
    trackEvent.mockReset();
  });

  test("SendGrid events update analytics", async () => {
    const events = [
      { event: "delivered" },
      { event: "open" },
      { event: "click" },
      { event: "unsubscribe" },
      { event: "bounce" },
    ];
    const body = JSON.stringify(events);
    const timestamp = "123456789";
    const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
      namedCurve: "P-256",
    });
    const publicKeyPem = publicKey
      .export({ format: "pem", type: "spki" })
      .toString();
    const signature = crypto
      .createSign("sha256")
      .update(timestamp + body)
      .sign(privateKey)
      .toString("base64");

    process.env.SENDGRID_WEBHOOK_PUBLIC_KEY = publicKeyPem;
    const { POST } = await import(
      "../src/app/api/marketing/email/provider-webhooks/sendgrid/route"
    );

    const req = {
      nextUrl: new URL(`https://example.com?shop=${shop}`),
      headers: new Headers({
        "x-twilio-email-event-webhook-signature": signature,
        "x-twilio-email-event-webhook-timestamp": timestamp,
      }),
      text: async () => body,
    } as unknown as NextRequest;

    const res = await POST(req);
    expect(res.status).toBe(200);

    expect(trackEvent.mock.calls.map((c) => c[1].type)).toEqual([
      "email_delivered",
      "email_open",
      "email_click",
      "email_unsubscribe",
      "email_bounce",
    ]);
  });

  test("Resend events update analytics", async () => {
    const secret = "resend-secret";
    process.env.RESEND_WEBHOOK_SECRET = secret;
    const { POST } = await import(
      "../src/app/api/marketing/email/provider-webhooks/resend/route"
    );
    const events = [
      { type: "email.delivered" },
      { type: "email.opened" },
      { type: "email.clicked" },
      { type: "email.unsubscribed" },
      { type: "email.bounced" },
    ];
    for (const ev of events) {
      const body = JSON.stringify(ev);
      const sig = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");
      const req = {
        nextUrl: new URL(`https://example.com?shop=${shop}`),
        headers: new Headers({ "x-resend-signature": sig }),
        text: async () => body,
      } as unknown as NextRequest;
      const res = await POST(req);
      expect(res.status).toBe(200);
    }
    expect(trackEvent.mock.calls.map((c) => c[1].type)).toEqual([
      "email_delivered",
      "email_open",
      "email_click",
      "email_unsubscribe",
      "email_bounce",
    ]);
  });
});

