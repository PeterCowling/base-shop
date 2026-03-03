// apps/brikette/src/app/api/recovery/quote/send/route.test.ts
// Unit tests for the recovery quote email send route.
// All external dependencies are mocked. Module-level state (idempotency Map)
// is reset between tests via jest.resetModules() + dynamic import.

import { NextResponse } from "next/server";

jest.mock("@acme/email/send", () => ({
  sendCampaignEmail: jest.fn(),
  getProviderOrder: jest.fn(() => ["sendgrid"]),
}));
jest.mock("@/config/hotel", () => ({
  CONTACT_EMAIL: "test-operator@example.com",
}));
jest.mock("@/utils/recoveryQuoteCalc", () => ({
  buildQuoteIdempotencyKey: jest.fn(() => "rq:2026-06-01|2026-06-03|1|room_10|"),
  buildRecoveryQuote: jest.fn(() => ({
    mode: "from_price",
    pricePerNight: 80,
    totalFrom: 160,
    nights: 2,
    currency: "EUR",
    priceSource: "indicative",
  })),
}));
jest.mock("@/utils/recoveryQuote", () => ({
  RecoveryQuoteContext: {},
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_CONTEXT = {
  checkin: "2026-06-01",
  checkout: "2026-06-03",
  pax: 1,
  source_route: "/book",
  room_id: "room_10",
};

const BASE_BODY = {
  context: BASE_CONTEXT,
  guestEmail: "guest@example.com",
  consentVersion: "v1",
  leadCaptureId: "lc-abc123",
  resumeLink: "https://brikette.com/book?resume=1",
};

function makeRequest(body: unknown): Request {
  return new Request("https://hostel.test/api/recovery/quote/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/recovery/quote/send", () => {
  // Dynamically imported route module (reset between tests to clear idempotency Map)
  type RouteModule = typeof import("./route");
  let POST: RouteModule["POST"];

  // Mocked module references (retrieved from jest.mock factories above)
  let mockSendCampaignEmail: jest.Mock;
  let mockGetProviderOrder: jest.Mock;
  let mockBuildQuoteIdempotencyKey: jest.Mock;
  let mockBuildRecoveryQuote: jest.Mock;

  beforeEach(async () => {
    jest.resetModules();

    // Re-apply mocks after resetModules so they are present for the fresh import
    jest.mock("@acme/email/send", () => ({
      sendCampaignEmail: jest.fn(),
      getProviderOrder: jest.fn(() => ["sendgrid"]),
    }));
    jest.mock("@/config/hotel", () => ({
      CONTACT_EMAIL: "test-operator@example.com",
    }));
    jest.mock("@/utils/recoveryQuoteCalc", () => ({
      buildQuoteIdempotencyKey: jest.fn(() => "rq:2026-06-01|2026-06-03|1|room_10|"),
      buildRecoveryQuote: jest.fn(() => ({
        mode: "from_price",
        pricePerNight: 80,
        totalFrom: 160,
        nights: 2,
        currency: "EUR",
        priceSource: "indicative",
      })),
    }));
    jest.mock("@/utils/recoveryQuote", () => ({
      RecoveryQuoteContext: {},
    }));

    // Import fresh route module with empty idempotency Map
    const mod = await import("./route") as RouteModule;
    POST = mod.POST;

    // Retrieve mock references from the freshly-loaded module's dependencies
    const emailMod = await import("@acme/email/send");
    mockSendCampaignEmail = emailMod.sendCampaignEmail as jest.Mock;
    mockGetProviderOrder = emailMod.getProviderOrder as jest.Mock;

    const calcMod = await import("@/utils/recoveryQuoteCalc");
    mockBuildQuoteIdempotencyKey = calcMod.buildQuoteIdempotencyKey as jest.Mock;
    mockBuildRecoveryQuote = calcMod.buildRecoveryQuote as jest.Mock;

    // Suppress console.info / console.error output in tests
    jest.spyOn(console, "info").mockImplementation(() => undefined);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // TC-03-01: Valid request → sendCampaignEmail called with correct args → status "accepted"
  it("TC-03-01: valid request sends email and returns accepted", async () => {
    mockSendCampaignEmail.mockResolvedValue(undefined);

    const req = makeRequest(BASE_BODY);
    const res = await POST(req);
    const body = await res.json() as { status: string; idempotencyKey: string };

    expect(res.status).toBe(200);
    expect(body.status).toBe("accepted");
    expect(body.idempotencyKey).toBe("rq:2026-06-01|2026-06-03|1|room_10|");
    expect(mockSendCampaignEmail).toHaveBeenCalledTimes(1);
    expect(mockSendCampaignEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "test-operator@example.com",
        campaignId: "rq:2026-06-01|2026-06-03|1|room_10|",
        subject: expect.stringContaining("2026-06-01"),
      }),
    );
  });

  // TC-03-02: Duplicate idempotency key → sendCampaignEmail NOT called again → status "duplicate"
  it("TC-03-02: duplicate key on second request returns duplicate without re-sending", async () => {
    mockSendCampaignEmail.mockResolvedValue(undefined);

    const req1 = makeRequest(BASE_BODY);
    await POST(req1);

    const req2 = makeRequest(BASE_BODY);
    const res2 = await POST(req2);
    const body2 = await res2.json() as { status: string; idempotencyKey: string };

    expect(res2.status).toBe(200);
    expect(body2.status).toBe("duplicate");
    // sendCampaignEmail called exactly once (not on duplicate)
    expect(mockSendCampaignEmail).toHaveBeenCalledTimes(1);
  });

  // TC-03-03: Missing guestEmail → 400 invalid_request
  it("TC-03-03: missing guestEmail returns 400 invalid_request", async () => {
    const req = makeRequest({ ...BASE_BODY, guestEmail: undefined });
    const res = await POST(req);
    const body = await res.json() as { error: string };

    expect(res.status).toBe(400);
    expect(body.error).toBe("invalid_request");
    expect(mockSendCampaignEmail).not.toHaveBeenCalled();
  });

  // TC-03-04: Missing context.checkin → 400 invalid_request
  it("TC-03-04: missing context.checkin returns 400 invalid_request", async () => {
    const bodyWithoutCheckin = {
      ...BASE_BODY,
      context: { ...BASE_CONTEXT, checkin: undefined },
    };
    const req = makeRequest(bodyWithoutCheckin);
    const res = await POST(req);
    const body = await res.json() as { error: string };

    expect(res.status).toBe(400);
    expect(body.error).toBe("invalid_request");
    expect(mockSendCampaignEmail).not.toHaveBeenCalled();
  });

  // TC-03-05: EMAIL_PROVIDER=smtp (no API provider) → 503 provider_not_configured
  it("TC-03-05: smtp-only provider order returns 503 provider_not_configured", async () => {
    mockGetProviderOrder.mockReturnValue(["smtp"]);

    const req = makeRequest(BASE_BODY);
    const res = await POST(req);
    const body = await res.json() as { error: string };

    expect(res.status).toBe(503);
    expect(body.error).toBe("provider_not_configured");
    expect(mockSendCampaignEmail).not.toHaveBeenCalled();
  });

  // TC-03-06: sendCampaignEmail throws → 500 send_failed
  it("TC-03-06: sendCampaignEmail rejection returns 500 send_failed", async () => {
    mockSendCampaignEmail.mockRejectedValue(new Error("provider unavailable"));

    const req = makeRequest(BASE_BODY);
    const res = await POST(req);
    const body = await res.json() as { error: string };

    expect(res.status).toBe(500);
    expect(body.error).toBe("send_failed");
  });

  // TC-03-07: priceSource "none" (unknown room) → email still sent; no crash
  it("TC-03-07: priceSource=none still sends email and returns accepted", async () => {
    mockBuildRecoveryQuote.mockReturnValue({
      mode: "from_price",
      pricePerNight: null,
      totalFrom: null,
      nights: 2,
      currency: "EUR",
      priceSource: "none",
    });
    mockSendCampaignEmail.mockResolvedValue(undefined);

    const req = makeRequest({ ...BASE_BODY, context: { ...BASE_CONTEXT, room_id: "room_unknown" } });
    const res = await POST(req);
    const body = await res.json() as { status: string };

    expect(res.status).toBe(200);
    expect(body.status).toBe("accepted");
    expect(mockSendCampaignEmail).toHaveBeenCalledTimes(1);
    // Body text should note price not calculated (indicative label path not used)
    const callArgs = mockSendCampaignEmail.mock.calls[0][0] as { text: string };
    expect(callArgs.text).toContain("not yet calculated");
  });

  // TC-03-08: Malformed JSON body → 400 invalid_request
  it("TC-03-08: malformed JSON body returns 400 invalid_request", async () => {
    const req = new Request("https://hostel.test/api/recovery/quote/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json{",
    });
    const res = await POST(req);
    const body = await res.json() as { error: string };

    expect(res.status).toBe(400);
    expect(body.error).toBe("invalid_request");
  });
});
