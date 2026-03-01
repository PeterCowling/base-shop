// apps/caryina/src/app/api/analytics/event/route.test.ts
// Unit tests for POST /api/analytics/event (TC-01 through TC-05).

import { NextRequest } from "next/server";

import { POST } from "@/app/api/analytics/event/route";

jest.mock("@acme/platform-core/analytics", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("@acme/platform-core/repositories/settings.server", () => ({
  getShopSettings: jest.fn(),
}));

// shop.json is imported by the route as a relative path from the route file;
// resolved to apps/caryina/shop.json
jest.mock("../../../../../shop.json", () => ({ id: "caryina" }));

const mockAnalytics = jest.requireMock("@acme/platform-core/analytics") as {
  trackEvent: jest.Mock;
};
const mockSettings = jest.requireMock(
  "@acme/platform-core/repositories/settings.server",
) as { getShopSettings: jest.Mock };

const { trackEvent } = mockAnalytics;
const { getShopSettings } = mockSettings;

/**
 * Build a NextRequest with optional Cookie header and JSON body.
 */
const makeReq = (body: unknown, cookieValue?: string) =>
  new NextRequest("http://localhost/api/analytics/event", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookieValue !== undefined ? { Cookie: `consent.analytics=${cookieValue}` } : {}),
    },
    body: JSON.stringify(body),
  });

describe("POST /api/analytics/event", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: analytics enabled
    getShopSettings.mockResolvedValue({ analytics: { enabled: true } });
  });

  // TC-01: No consent.analytics cookie → 202 skipped no-consent.
  it("TC-01: no consent cookie → 202 skipped no-consent", async () => {
    const res = await POST(makeReq({ type: "page_view" }));
    const body = await res.json();

    expect(res.status).toBe(202);
    expect(body).toMatchObject({ ok: true, skipped: "no-consent" });
    expect(trackEvent).not.toHaveBeenCalled();
  });

  // TC-02: consent.analytics=false → 202 skipped no-consent.
  it("TC-02: consent.analytics=false → 202 skipped no-consent", async () => {
    const res = await POST(makeReq({ type: "page_view" }, "false"));
    const body = await res.json();

    expect(res.status).toBe(202);
    expect(body).toMatchObject({ ok: true, skipped: "no-consent" });
    expect(trackEvent).not.toHaveBeenCalled();
  });

  // TC-03: consent given, valid event type → 200 ok, trackEvent called once.
  it("TC-03: consent + valid type → 200 ok, trackEvent called", async () => {
    trackEvent.mockResolvedValue(undefined);

    const res = await POST(makeReq({ type: "page_view", path: "/" }, "true"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ ok: true });
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith(
      "caryina",
      expect.objectContaining({ type: "page_view" }),
    );
  });

  // TC-04: consent given, invalid event type → 400 Invalid analytics payload.
  it("TC-04: consent + invalid type → 400 validation error", async () => {
    const res = await POST(makeReq({ type: "unknown_event" }, "true"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toMatchObject({ error: "Invalid analytics payload" });
    expect(trackEvent).not.toHaveBeenCalled();
  });

  // TC-05: getShopSettings returns analytics.enabled=false → 202 skipped analytics-disabled.
  it("TC-05: analytics disabled in settings → 202 skipped analytics-disabled", async () => {
    getShopSettings.mockResolvedValue({ analytics: { enabled: false } });

    const res = await POST(makeReq({ type: "page_view" }, "true"));
    const body = await res.json();

    expect(res.status).toBe(202);
    expect(body).toMatchObject({ ok: true, skipped: "analytics-disabled" });
    expect(trackEvent).not.toHaveBeenCalled();
  });
});
