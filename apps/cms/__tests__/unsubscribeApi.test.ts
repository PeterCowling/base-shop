import type { NextRequest } from "next/server";

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
  let trackEvent: jest.Mock;

  beforeEach(() => {
    trackEvent = require("@platform-core/analytics").trackEvent as jest.Mock;
    trackEvent.mockReset();
  });

  test("records unsubscribe event", async () => {
    const { GET } = await import(
      "../src/app/api/marketing/email/unsubscribe/route"
    );
    const req = {
      nextUrl: new URL(
        "https://example.com?shop=shop1&email=a%40example.com&campaign=c1",
      ),
    } as unknown as NextRequest;
    const res = await GET(req);
    const { trackEvent } = require("@platform-core/analytics");
    expect(trackEvent).toHaveBeenCalledWith("shop1", {
      type: "email_unsubscribe",
      email: "a@example.com",
      campaign: "c1",
    });
    expect(res.status).toBe(200);
  });

  test("missing parameters return 400", async () => {
    const { GET } = await import(
      "../src/app/api/marketing/email/unsubscribe/route"
    );
    const req = {
      nextUrl: new URL("https://example.com?shop=shop1"),
    } as unknown as NextRequest;
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(trackEvent).not.toHaveBeenCalled();
  });
});
