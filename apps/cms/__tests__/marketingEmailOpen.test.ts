import { jest } from "@jest/globals";
import { NextRequest } from "next/server";

jest.mock("@platform-core/analytics", () => ({
  __esModule: true,
  trackEvent: jest.fn(),
}));
const trackEvent = require("@platform-core/analytics").trackEvent as jest.Mock;

describe("marketing email open endpoint", () => {
  test("ignores random token parameter", async () => {
    const { GET } = await import("../src/app/api/marketing/email/open/route");
    const req = new NextRequest(
      "https://example.com/api/marketing/email/open?shop=test&campaign=c1&t=123"
    );
    await GET(req);
    expect(trackEvent).toHaveBeenCalledWith("test", {
      type: "email_open",
      campaign: "c1",
    });
  });
});

