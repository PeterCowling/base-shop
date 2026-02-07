import type { NextRequest } from "next/server";
import crypto from "crypto";

process.env.CART_COOKIE_SECRET = "secret";

jest.mock("@acme/platform-core/analytics", () => ({
  __esModule: true,
  trackEvent: jest.fn(),
}));

jest.mock("@acme/email/analytics", () => {
  const actual = jest.requireActual("@acme/email/analytics");
  return {
    __esModule: true,
    ...actual,
    mapResendEvent: jest.fn(),
  };
});

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
  let mapResendEvent: jest.Mock;

  beforeEach(() => {
    trackEvent = require("@acme/platform-core/analytics").trackEvent as jest.Mock;
    mapResendEvent =
      require("@acme/email/analytics").mapResendEvent as jest.Mock;
    trackEvent.mockReset();
    mapResendEvent.mockReset();
    delete process.env.RESEND_WEBHOOK_SECRET;
    delete process.env.SENDGRID_WEBHOOK_PUBLIC_KEY;
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

  test("SendGrid missing shop query returns 400", async () => {
    const body = "[]";
    const { POST } = await import(
      "../src/app/api/marketing/email/provider-webhooks/sendgrid/route"
    );
    const req = {
      nextUrl: new URL("https://example.com"),
      headers: new Headers(),
      text: async () => body,
    } as unknown as NextRequest;
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  test("SendGrid missing secrets returns 401", async () => {
    process.env.SENDGRID_WEBHOOK_PUBLIC_KEY = undefined;
    const body = "[]";
    const { POST } = await import(
      "../src/app/api/marketing/email/provider-webhooks/sendgrid/route"
    );
    const req = {
      nextUrl: new URL(`https://example.com?shop=${shop}`),
      headers: new Headers(),
      text: async () => body,
    } as unknown as NextRequest;
    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  test("SendGrid invalid signature returns 400", async () => {
    const body = "[]";
    const timestamp = "123";
    const kp1 = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
    const kp2 = crypto.generateKeyPairSync("ec", { namedCurve: "P-256" });
    process.env.SENDGRID_WEBHOOK_PUBLIC_KEY = kp1.publicKey
      .export({ format: "pem", type: "spki" })
      .toString();
    const signature = crypto
      .createSign("sha256")
      .update(timestamp + body)
      .sign(kp2.privateKey)
      .toString("base64");
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
    expect(res.status).toBe(400);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  test("SendGrid invalid payload returns 400", async () => {
    const body = "{";
    const timestamp = "123";
    const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
      namedCurve: "P-256",
    });
    process.env.SENDGRID_WEBHOOK_PUBLIC_KEY = publicKey
      .export({ format: "pem", type: "spki" })
      .toString();
    const signature = crypto
      .createSign("sha256")
      .update(timestamp + body)
      .sign(privateKey)
      .toString("base64");
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
    expect(res.status).toBe(400);
    expect(trackEvent).not.toHaveBeenCalled();
  });

  describe("Resend webhook", () => {
    test("missing shop query returns 400", async () => {
      const secret = "resend-secret";
      process.env.RESEND_WEBHOOK_SECRET = secret;
      const body = "{}";
      const sig = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");
      const { POST } = await import(
        "../src/app/api/marketing/email/provider-webhooks/resend/route"
      );
      const req = {
        nextUrl: new URL("https://example.com"),
        headers: new Headers({ "x-resend-signature": sig }),
        text: async () => body,
      } as unknown as NextRequest;
      const res = await POST(req);
      expect(res.status).toBe(400);
      expect(trackEvent).not.toHaveBeenCalled();
      expect(mapResendEvent).not.toHaveBeenCalled();
    });

    test("RESEND_WEBHOOK_SECRET unset returns 401", async () => {
      const body = "{}";
      const { POST } = await import(
        "../src/app/api/marketing/email/provider-webhooks/resend/route"
      );
      const req = {
        nextUrl: new URL(`https://example.com?shop=${shop}`),
        headers: new Headers({ "x-resend-signature": "sig" }),
        text: async () => body,
      } as unknown as NextRequest;
      const res = await POST(req);
      expect(res.status).toBe(401);
      expect(trackEvent).not.toHaveBeenCalled();
      expect(mapResendEvent).not.toHaveBeenCalled();
    });

    test("invalid signature returns 400", async () => {
      const secret = "resend-secret";
      process.env.RESEND_WEBHOOK_SECRET = secret;
      const body = "{}";
      const sig = crypto
        .createHmac("sha256", "wrong")
        .update(body)
        .digest("hex");
      const { POST } = await import(
        "../src/app/api/marketing/email/provider-webhooks/resend/route"
      );
      const req = {
        nextUrl: new URL(`https://example.com?shop=${shop}`),
        headers: new Headers({ "x-resend-signature": sig }),
        text: async () => body,
      } as unknown as NextRequest;
      const res = await POST(req);
      expect(res.status).toBe(400);
      expect(trackEvent).not.toHaveBeenCalled();
      expect(mapResendEvent).not.toHaveBeenCalled();
    });

    test("invalid signature parse error returns 400", async () => {
      const secret = "resend-secret";
      process.env.RESEND_WEBHOOK_SECRET = secret;
      const body = "{}";
      const { POST } = await import(
        "../src/app/api/marketing/email/provider-webhooks/resend/route"
      );
      const req = {
        nextUrl: new URL(`https://example.com?shop=${shop}`),
        headers: new Headers({ "x-resend-signature": "short" }),
        text: async () => body,
      } as unknown as NextRequest;
      const res = await POST(req);
      expect(res.status).toBe(400);
      expect(trackEvent).not.toHaveBeenCalled();
      expect(mapResendEvent).not.toHaveBeenCalled();
    });

    test("invalid JSON payload returns 400", async () => {
      const secret = "resend-secret";
      process.env.RESEND_WEBHOOK_SECRET = secret;
      const body = "{";
      const sig = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");
      const { POST } = await import(
        "../src/app/api/marketing/email/provider-webhooks/resend/route"
      );
      const req = {
        nextUrl: new URL(`https://example.com?shop=${shop}`),
        headers: new Headers({ "x-resend-signature": sig }),
        text: async () => body,
      } as unknown as NextRequest;
      const res = await POST(req);
      expect(res.status).toBe(400);
      expect(trackEvent).not.toHaveBeenCalled();
      expect(mapResendEvent).not.toHaveBeenCalled();
    });

    test("valid payload triggers trackEvent", async () => {
      const secret = "resend-secret";
      process.env.RESEND_WEBHOOK_SECRET = secret;
      const event = { type: "email.delivered" };
      const mapped = { type: "mapped" };
      mapResendEvent.mockReturnValue(mapped);
      const body = JSON.stringify(event);
      const sig = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");
      const { POST } = await import(
        "../src/app/api/marketing/email/provider-webhooks/resend/route"
      );
      const req = {
        nextUrl: new URL(`https://example.com?shop=${shop}`),
        headers: new Headers({ "x-resend-signature": sig }),
        text: async () => body,
      } as unknown as NextRequest;
      const res = await POST(req);
      expect(res.status).toBe(200);
      expect(mapResendEvent).toHaveBeenCalledWith(event);
      expect(trackEvent).toHaveBeenCalledWith(shop, mapped);
    });
  });
});

