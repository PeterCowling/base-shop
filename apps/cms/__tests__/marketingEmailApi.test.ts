import { jest } from "@jest/globals";
import type { NextRequest } from "next/server";
import path from "node:path";
import { promises as fs } from "node:fs";
import { DATA_ROOT } from "@platform-core/dataRoot";

jest.doMock("@platform-core/analytics", () => ({
  __esModule: true,
  trackEvent: jest.fn(),
}));
jest.doMock(
  "@acme/email-templates",
  () => ({
    __esModule: true,
    marketingEmailTemplates: [],
  }),
  { virtual: true }
);

const coreEnv: Record<string, any> = {};
jest.doMock("@acme/config", () => ({ __esModule: true, env: coreEnv }), {
  virtual: true,
});
jest.doMock(
  "@acme/config/env/core",
  () => ({ __esModule: true, loadCoreEnv: () => coreEnv }),
  { virtual: true },
);

process.env.CART_COOKIE_SECRET = "secret";
process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test";
process.env.STRIPE_WEBHOOK_SECRET = "whsec";
process.env.RESEND_API_KEY = "re_test";

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
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test setup creates a directory under controlled DATA_ROOT using a literal shop id
    await fs.mkdir(shopDir, { recursive: true });
  });

  test(
    "resolves recipients from segment when list empty",
    async () => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test writes a fixture file under controlled DATA_ROOT/shop path
    await fs.writeFile(
      path.join(shopDir, "segments.json"),
      JSON.stringify([
        { id: "vip", name: "VIP", filters: [{ field: "type", value: "purchase" }] },
      ]),
      "utf8"
    );
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test writes analytics events to a file within controlled DATA_ROOT/shop path
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
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test reads generated campaigns file within controlled DATA_ROOT/shop path
      await fs.readFile(path.join(shopDir, "campaigns.json"), "utf8")
    );
    expect(campaigns[0].recipients.sort()).toEqual(
      ["a@example.com", "b@example.com"].sort()
    );
    },
    20000
  );

  test("falls back to manual recipients when provided", async () => {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test writes an empty analytics file under controlled DATA_ROOT/shop path
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
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- Test reads generated campaigns file within controlled DATA_ROOT/shop path
      await fs.readFile(path.join(shopDir, "campaigns.json"), "utf8")
    );
    expect(campaigns[0].recipients).toEqual(["manual@example.com"]);
  });
});

describe("marketing email API campaign listing", () => {
  const shop = "listshop";

  beforeEach(() => {
    jest.resetModules();
  });

  test("lists campaigns with aggregated metrics", async () => {
    const listCampaigns = jest.fn().mockResolvedValue([
      { id: "c1", shop, recipients: [], subject: "Hi", body: "<p>Hi</p>" },
    ]);
    const listEvents = jest.fn().mockResolvedValue([
      { type: "email_sent", campaign: "c1" },
      { type: "email_open", campaign: "c1" },
      { type: "email_click", campaign: "c1" },
    ]);
    jest.doMock("@acme/email", () => ({
      __esModule: true,
      createCampaign: jest.fn(),
      listCampaigns,
      renderTemplate: jest.fn(),
    }));
    jest.doMock("@platform-core/repositories/analytics.server", () => ({
      __esModule: true,
      listEvents,
    }));
    const { GET } = await import("../src/app/api/marketing/email/route");
    const req = {
      nextUrl: new URL(`http://example.com?shop=${shop}`),
    } as unknown as NextRequest;
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.campaigns).toEqual([
      {
        id: "c1",
        shop,
        recipients: [],
        subject: "Hi",
        body: "<p>Hi</p>",
        metrics: { sent: 1, opened: 1, clicked: 1 },
      },
    ]);
  });
});

describe("marketing email API templates", () => {
  const shop = "tmplshop";

  beforeEach(() => {
    jest.resetModules();
  });

  test("rejects invalid templateId", async () => {
    const renderTemplate = jest.fn(() => {
      throw new Error("Unknown template: bad");
    });
    jest.doMock("@acme/email", () => ({
      __esModule: true,
      createCampaign: jest.fn(),
      renderTemplate,
      listCampaigns: jest.fn(),
    }));
    const { POST } = await import("../src/app/api/marketing/email/route");
    await expect(
      POST({
        json: async () => ({
          shop,
          recipients: ["a@example.com"],
          subject: "Hi",
          body: "<p>Hi</p>",
          templateId: "bad",
        }),
      } as unknown as NextRequest)
    ).rejects.toThrow("Unknown template");
  });

  test("calls renderTemplate when templateId provided", async () => {
    const renderTemplate = jest.fn(() => "<p>Rendered</p>");
    const createCampaign = jest.fn().mockResolvedValue("id1");
    jest.doMock("@acme/email", () => ({
      __esModule: true,
      createCampaign,
      renderTemplate,
      listCampaigns: jest.fn(),
    }));
    const { POST } = await import("../src/app/api/marketing/email/route");
    const res = await POST({
      json: async () => ({
        shop,
        recipients: ["a@example.com"],
        subject: "Hi",
        body: "<p>Hi</p>",
        templateId: "basic",
      }),
    } as unknown as NextRequest);
    expect(res.status).toBe(200);
    expect(renderTemplate).toHaveBeenCalledWith("basic", {
      subject: "Hi",
      body: "<p>Hi</p>",
    });
  });

  test("appends unsubscribe placeholder when no templateId", async () => {
    const createCampaign = jest.fn().mockResolvedValue("id1");
    const renderTemplate = jest.fn();
    jest.doMock("@acme/email", () => ({
      __esModule: true,
      createCampaign,
      renderTemplate,
      listCampaigns: jest.fn(),
    }));
    const { POST } = await import("../src/app/api/marketing/email/route");
    const res = await POST({
      json: async () => ({
        shop,
        recipients: ["a@example.com"],
        subject: "Hi",
        body: "<p>Hi</p>",
      }),
    } as unknown as NextRequest);
    expect(res.status).toBe(200);
    expect(renderTemplate).not.toHaveBeenCalled();
    expect(createCampaign).toHaveBeenCalledWith({
      shop,
      recipients: ["a@example.com"],
      subject: "Hi",
      body: "<p>Hi</p><p>%%UNSUBSCRIBE%%</p>",
      segment: undefined,
      sendAt: undefined,
      templateId: undefined,
    });
  });
});

describe("marketing email API validation", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test("GET missing shop returns 400", async () => {
    const { GET } = await import("../src/app/api/marketing/email/route");
    const req = { nextUrl: new URL("https://example.com") } as unknown as NextRequest;
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  test("POST missing required fields returns 400", async () => {
    const createCampaign = jest.fn();
    jest.doMock("@acme/email", () => ({
      __esModule: true,
      createCampaign,
      renderTemplate: jest.fn(),
      listCampaigns: jest.fn(),
    }));
    const { POST } = await import("../src/app/api/marketing/email/route");
    const res = await POST({
      json: async () => ({
        recipients: ["a@example.com"],
        subject: "Hi",
        body: "<p>Hi</p>",
      }),
    } as unknown as NextRequest);
    expect(res.status).toBe(400);
    expect(createCampaign).not.toHaveBeenCalled();
  });

  test("POST returns 500 when createCampaign fails", async () => {
    const createCampaign = jest.fn(() => Promise.reject(new Error("fail")));
    jest.doMock("@acme/email", () => ({
      __esModule: true,
      createCampaign,
      renderTemplate: jest.fn(),
      listCampaigns: jest.fn(),
    }));
    const { POST } = await import("../src/app/api/marketing/email/route");
    const res = await POST({
      json: async () => ({
        shop: "errshop",
        recipients: ["a@example.com"],
        subject: "Hi",
        body: "<p>Hi</p>",
      }),
    } as unknown as NextRequest);
    expect(res.status).toBe(500);
  });
});
