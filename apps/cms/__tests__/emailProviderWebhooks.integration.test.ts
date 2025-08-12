import { jest } from "@jest/globals";
import { generateKeyPairSync, createSign, createHmac } from "node:crypto";

if (typeof (Response as any).json !== "function") {
  (Response as any).json = (data: unknown, init?: ResponseInit) =>
    new Response(JSON.stringify(data), init);
}

describe("email provider webhooks", () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    delete (process.env as any).SENDGRID_WEBHOOK_PUBLIC_KEY;
    delete (process.env as any).RESEND_WEBHOOK_SECRET;
    delete (process.env as any).CART_COOKIE_SECRET;
  });

  it("maps SendGrid events to analytics", async () => {
    const trackEvent = jest.fn();
    jest.doMock("@platform-core/analytics", () => ({ trackEvent }));

    (process.env as any).CART_COOKIE_SECRET = "secret";

    const { privateKey, publicKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
    });
    (process.env as any).SENDGRID_WEBHOOK_PUBLIC_KEY = publicKey
      .export({ type: "pkcs1", format: "pem" })
      .toString();
    const body = JSON.stringify([
      { event: "delivered" },
      { event: "open" },
      { event: "click" },
      { event: "unsubscribe" },
      { event: "bounce" },
    ]);
    const timestamp = Date.now().toString();
    const signer = createSign("sha256");
    signer.update(timestamp + body);
    const signature = signer.sign(privateKey, "base64");
    const req = {
      headers: new Headers({
        "x-twilio-email-event-webhook-signature": signature,
        "x-twilio-email-event-webhook-timestamp": timestamp,
      }),
      nextUrl: new URL("https://example.com/api?shop=test-shop"),
      text: () => Promise.resolve(body),
    } as any;

    const { POST } = await import(
      "../src/app/api/marketing/email/provider-webhooks/sendgrid/route"
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(trackEvent.mock.calls.map((c) => c[1].type)).toEqual([
      "email_delivered",
      "email_open",
      "email_click",
      "email_unsubscribed",
      "email_bounced",
    ]);
  });

  it("maps Resend events to analytics", async () => {
    const trackEvent = jest.fn();
    jest.doMock("@platform-core/analytics", () => ({ trackEvent }));

    (process.env as any).RESEND_WEBHOOK_SECRET = "shhh";
    (process.env as any).CART_COOKIE_SECRET = "secret";
    const body = JSON.stringify([
      { type: "delivered" },
      { type: "opened" },
      { type: "clicked" },
      { type: "unsubscribed" },
      { type: "bounced" },
    ]);
    const signature = createHmac("sha256", "shhh").update(body).digest("hex");
    const req = {
      headers: new Headers({ "x-resend-signature": signature }),
      nextUrl: new URL("https://example.com/api?shop=test-shop"),
      text: () => Promise.resolve(body),
    } as any;

    const { POST } = await import(
      "../src/app/api/marketing/email/provider-webhooks/resend/route"
    );
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(trackEvent.mock.calls.map((c) => c[1].type)).toEqual([
      "email_delivered",
      "email_open",
      "email_click",
      "email_unsubscribed",
      "email_bounced",
    ]);
  });
});
