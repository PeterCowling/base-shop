import type { NextRequest } from "next/server";

jest.mock("@acme/email", () => ({
  __esModule: true,
  emitClick: jest.fn(),
  emitOpen: jest.fn(),
}));

jest.mock("@platform-core/analytics", () => ({
  __esModule: true,
  trackEvent: jest.fn(),
}));

describe("email tracking routes", () => {
  let emitClick: jest.Mock;
  let emitOpen: jest.Mock;

  beforeEach(() => {
    jest.resetModules();
    emitClick = require("@acme/email").emitClick as jest.Mock;
    emitOpen = require("@acme/email").emitOpen as jest.Mock;
    emitClick.mockReset();
    emitOpen.mockReset();
  });

  test("click returns 400 for invalid URL", async () => {
    const { GET } = await import(
      "../src/app/api/marketing/email/click/route"
    );
    const nextUrl = new URL("https://example.com?url=http:");
    const req = {
      nextUrl,
      url: nextUrl.toString(),
    } as unknown as NextRequest;
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  test("click returns 400 for cross-origin URL", async () => {
    const { GET } = await import(
      "../src/app/api/marketing/email/click/route"
    );
    const nextUrl = new URL(
      "https://example.com?url=https://evil.com&shop=s&campaign=c"
    );
    const req = {
      nextUrl,
      url: nextUrl.toString(),
    } as unknown as NextRequest;
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(emitClick).not.toHaveBeenCalled();
  });

  test("click emits event when shop and campaign present", async () => {
    const { GET } = await import(
      "../src/app/api/marketing/email/click/route"
    );
    const nextUrl = new URL(
      "https://example.com?shop=shop1&campaign=c1&url=/foo"
    );
    const req = {
      nextUrl,
      url: nextUrl.toString(),
    } as unknown as NextRequest;
    const res = await GET(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://example.com/foo");
    expect(emitClick).toHaveBeenCalledWith("shop1", { campaign: "c1" });
  });

  test("open emits event when shop and campaign present", async () => {
    const { GET } = await import(
      "../src/app/api/marketing/email/open/route"
    );
    const nextUrl = new URL(
      "https://example.com?shop=shop1&campaign=c1&t=123"
    );
    const req = {
      nextUrl,
      url: nextUrl.toString(),
    } as unknown as NextRequest;
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(emitOpen).toHaveBeenCalledWith("shop1", { campaign: "c1" });
  });
});

