import type { NextRequest } from "next/server";
import path from "node:path";
import { promises as fs } from "node:fs";
import { DATA_ROOT } from "@platform-core/dataRoot";

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

describe("unsubscribe API", () => {
  const shop = "unsub-shop";
  const shopDir = path.join(DATA_ROOT, shop);
  let trackEvent: jest.Mock;

  beforeEach(async () => {
    await fs.rm(shopDir, { recursive: true, force: true });
    trackEvent = require("@platform-core/analytics").trackEvent as jest.Mock;
    trackEvent.mockReset();
  });

  it("records unsubscribes and tracks event", async () => {
    const { GET } = await import(
      "../src/app/api/marketing/email/unsubscribe/route"
    );
    const req = {
      nextUrl: new URL(
        `https://example.com?shop=${shop}&email=user@example.com&campaign=cmp1`
      ),
    } as unknown as NextRequest;
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(trackEvent).toHaveBeenCalledWith(shop, {
      type: "email_unsubscribe",
      campaign: "cmp1",
    });
    const data = JSON.parse(
      await fs.readFile(path.join(shopDir, "unsubscribes.json"), "utf8")
    );
    expect(data).toEqual(["user@example.com"]);
  });
});
