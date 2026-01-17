import { jest } from "@jest/globals";
import path from "node:path";
import { promises as fs } from "node:fs";
import { DATA_ROOT } from "@acme/platform-core/dataRoot";

jest.mock("@acme/platform-core/analytics", () => ({
  __esModule: true,
  trackEvent: jest.fn(),
}));

jest.setTimeout(15000);

jest.mock("@sendgrid/mail", () => ({
  __esModule: true,
  default: {
    setApiKey: jest.fn(),
    send: jest.fn(),
  },
}));

const resendSendMock = jest.fn();
jest.mock("resend", () => ({
  __esModule: true,
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: resendSendMock },
  })),
}));

let trackEvent: jest.Mock;

const shop = "intshop";
const shopDir = path.join(DATA_ROOT, shop);

beforeEach(async () => {
  jest.resetModules();
  jest.clearAllMocks();
  await fs.rm(shopDir, { recursive: true, force: true });
  await fs.mkdir(shopDir, { recursive: true });
  ({ trackEvent } = require("@acme/platform-core/analytics"));
  process.env.CART_COOKIE_SECRET = "secret";
  process.env.CAMPAIGN_FROM = "campaign@example.com";
  process.env.NEXT_PUBLIC_BASE_URL = "http://example.com";
});

afterEach(() => {
  delete process.env.EMAIL_PROVIDER;
  delete process.env.SENDGRID_API_KEY;
  delete process.env.SENDGRID_MARKETING_KEY;
  delete process.env.RESEND_API_KEY;
  delete process.env.CAMPAIGN_FROM;
  delete process.env.NEXT_PUBLIC_BASE_URL;
});

describe("campaign integration", () => {
  test("creates and sends scheduled campaign via SendGrid with analytics sync", async () => {
    process.env.EMAIL_PROVIDER = "sendgrid";
    process.env.SENDGRID_API_KEY = "sg";

    await fs.writeFile(
      path.join(shopDir, "analytics.jsonl"),
      JSON.stringify({ type: "segment:vip", email: "a@example.com" }) + "\n" +
        JSON.stringify({ type: "segment", segment: "vip", email: "b@example.com" }) +
        "\n",
      "utf8"
    );
    const past = new Date(Date.now() - 1000).toISOString();
    const campaigns = [
      {
        id: "c1",
        recipients: [],
        subject: "Seg",
        body: "<p>Seg</p>",
        segment: "vip",
        sendAt: past,
      },
    ];
    await fs.writeFile(
      path.join(shopDir, "campaigns.json"),
      JSON.stringify(campaigns, null, 2),
      "utf8"
    );

    const { sendDueCampaigns } = await import("../scheduler");
    const sgMail = require("@sendgrid/mail").default;
    await sendDueCampaigns();

    expect(sgMail.send).toHaveBeenCalledTimes(2);
    expect(sgMail.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: "a@example.com", subject: "Seg" })
    );
    expect(sgMail.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: "b@example.com", subject: "Seg" })
    );
    expect(trackEvent).toHaveBeenCalledTimes(2);
    expect(trackEvent).toHaveBeenCalledWith(shop, {
      type: "email_sent",
      campaign: "c1",
    });
    const updated = JSON.parse(
      await fs.readFile(path.join(shopDir, "campaigns.json"), "utf8")
    );
    expect(updated[0].recipients.sort()).toEqual(
      ["a@example.com", "b@example.com"].sort()
    );
    expect(updated[0].sentAt).toBeDefined();
  });

  test("creates and sends scheduled campaign via Resend with analytics sync", async () => {
    process.env.EMAIL_PROVIDER = "resend";
    process.env.RESEND_API_KEY = "rs";

    await fs.writeFile(path.join(shopDir, "analytics.jsonl"), "", "utf8");
    const past = new Date(Date.now() - 1000).toISOString();
    const campaigns = [
      {
        id: "c2",
        recipients: ["manual@example.com"],
        subject: "Man",
        body: "<p>Man</p>",
        segment: null,
        sendAt: past,
      },
    ];
    await fs.writeFile(
      path.join(shopDir, "campaigns.json"),
      JSON.stringify(campaigns, null, 2),
      "utf8"
    );

    const { sendDueCampaigns } = await import("../scheduler");
    await sendDueCampaigns();

    expect(resendSendMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: "manual@example.com", subject: "Man" })
    );
    expect(trackEvent).toHaveBeenCalledWith(shop, {
      type: "email_sent",
      campaign: "c2",
    });
    const updated = JSON.parse(
      await fs.readFile(path.join(shopDir, "campaigns.json"), "utf8")
    );
    expect(updated[0].sentAt).toBeDefined();
  });
});
