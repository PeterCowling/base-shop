import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { readGrowthLedger } from "@acme/lib/server";

import { getCurrentUserServer } from "@/lib/current-user.server-only";

import { GET } from "./route";

jest.mock("@acme/lib/server", () => ({
  readGrowthLedger: jest.fn(),
}));

jest.mock("@/lib/current-user.server-only", () => ({
  getCurrentUserServer: jest.fn(),
}));

describe("GET /api/business/[business]/growth-ledger", () => {
  beforeEach(() => {
    (getCurrentUserServer as jest.Mock).mockResolvedValue({
      id: "pete",
      name: "Pete",
      email: "pete@business-os.local",
      role: "admin",
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("TC-01: returns 200 with ledger payload for authorized business", async () => {
    (readGrowthLedger as jest.Mock).mockResolvedValue({
      schema_version: 1,
      ledger_revision: 3,
      business: "HEAD",
      period: {
        period_id: "2026-W07",
        start_date: "2026-02-09",
        end_date: "2026-02-15",
        forecast_id: "HEAD-FC-2026Q1",
      },
      threshold_set_id: "gts_ab12cd34ef56",
      threshold_set_hash:
        "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      threshold_locked_at: "2026-02-13T12:00:00.000Z",
      updated_at: "2026-02-13T12:00:00.000Z",
      stages: {
        acquisition: {
          status: "red",
          policy: { blocking_mode: "always" },
          metrics: {},
          reasons: [],
        },
        activation: {
          status: "yellow",
          policy: { blocking_mode: "always" },
          metrics: {},
          reasons: [],
        },
        revenue: {
          status: "green",
          policy: { blocking_mode: "always" },
          metrics: {},
          reasons: [],
        },
        retention: {
          status: "not_tracked",
          policy: { blocking_mode: "after_valid" },
          metrics: {},
          reasons: [],
        },
        referral: {
          status: "not_tracked",
          policy: { blocking_mode: "never" },
          metrics: {},
          reasons: [],
        },
      },
    });

    const response = await GET(
      new Request("http://localhost/api/business/HEAD/growth-ledger"),
      { params: Promise.resolve({ business: "HEAD" }) },
    );

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.business).toBe("HEAD");
    expect(data.ledger.ledger_revision).toBe(3);
    expect(readGrowthLedger).toHaveBeenCalledWith(
      "HEAD",
      expect.objectContaining({ dataRoot: expect.any(String) }),
    );
  });

  it("TC-02: returns typed 404 when ledger is not initialized", async () => {
    (readGrowthLedger as jest.Mock).mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/api/business/HEAD/growth-ledger"),
      { params: Promise.resolve({ business: "HEAD" }) },
    );

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toEqual({
      error: "ledger_not_initialized",
      business: "HEAD",
    });
  });

  it("TC-03: rejects malformed business id", async () => {
    const response = await GET(
      new Request("http://localhost/api/business/%2e%2e/growth-ledger"),
      { params: Promise.resolve({ business: "../" }) },
    );

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("invalid_business_code");
  });

  it("TC-04: rejects unauthorized business access", async () => {
    (getCurrentUserServer as jest.Mock).mockResolvedValue({
      id: "avery",
      name: "Avery",
      email: "avery@business-os.local",
      role: "user",
    });

    const response = await GET(
      new Request("http://localhost/api/business/HEAD/growth-ledger"),
      { params: Promise.resolve({ business: "HEAD" }) },
    );

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("unauthorized_business_access");
    expect(readGrowthLedger).not.toHaveBeenCalled();
  });
});
