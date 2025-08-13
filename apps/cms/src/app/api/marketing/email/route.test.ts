import path from "node:path";
import { promises as fs } from "node:fs";
import { NextRequest } from "next/server";
import { DATA_ROOT } from "@platform-core/dataRoot";

process.env.CART_COOKIE_SECRET = "secret";

jest.mock("@acme/email", () => ({
  __esModule: true,
  sendCampaignEmail: jest.fn().mockResolvedValue(undefined),
  resolveSegment: jest.fn(),
}));

jest.mock("@platform-core/analytics", () => ({
  __esModule: true,
  trackEvent: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@acme/ui", () => ({ marketingEmailTemplates: [] }), { virtual: true });
jest.mock("@acme/config", () => ({ env: { NEXT_PUBLIC_BASE_URL: "" } }), {
  virtual: true,
});

const { sendCampaignEmail } = require("@acme/email");
const sendCampaignEmailMock = sendCampaignEmail as jest.Mock;

describe("POST /api/marketing/email", () => {
  const shop = "routetest";
  const shopDir = path.join(DATA_ROOT, shop);

  beforeEach(async () => {
    jest.clearAllMocks();
    await fs.rm(shopDir, { recursive: true, force: true });
    await fs.mkdir(shopDir, { recursive: true });
    process.env.NEXT_PUBLIC_BASE_URL = "";
  });

  afterAll(async () => {
    await fs.rm(shopDir, { recursive: true, force: true });
  });

  it("includes cache-busting token in pixel URL", async () => {
    const req = new NextRequest("http://localhost/api/marketing/email", {
      method: "POST",
      body: JSON.stringify({
        shop,
        recipients: ["a@example.com"],
        subject: "Sub",
        body: "<p>Hi</p>",
      }),
      headers: { "content-type": "application/json" },
    });

    const { POST } = await import("./route");
    await POST(req);

    expect(sendCampaignEmailMock).toHaveBeenCalledTimes(1);
    const args = sendCampaignEmailMock.mock.calls[0][0];
    expect(args.html).toMatch(/open\?shop=.*&campaign=.*&t=\d+/);
  });
});

