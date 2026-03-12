import { computeAnalytics } from "@/lib/inbox/analytics.server";

import { requireStaffAuth } from "../_shared/staff-auth";
import { GET } from "../inbox/analytics/route";

jest.mock("@/lib/inbox/analytics.server", () => ({
  ALL_METRIC_GROUPS: ["volume", "quality", "resolution", "admission"],
  computeAnalytics: jest.fn(),
}));

jest.mock("../_shared/staff-auth", () => ({
  requireStaffAuth: jest.fn(),
}));

const requireStaffAuthMock = jest.mocked(requireStaffAuth);
const computeAnalyticsMock = jest.mocked(computeAnalytics);

function buildGetRequest(url: string): Request {
  return new Request(url, {
    method: "GET",
    headers: { Authorization: "Bearer test-token" },
  });
}

describe("GET /api/mcp/inbox/analytics", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    requireStaffAuthMock.mockResolvedValue({
      ok: true,
      uid: "staff-1",
      roles: ["staff"],
    });
  });

  // TC-01: Valid auth with no params returns all metrics
  it("returns all 4 metric groups when no params provided", async () => {
    computeAnalyticsMock.mockResolvedValue({
      volume: { totalThreads: 10, admitted: 8, drafted: 6, sent: 5, resolved: 3 },
      quality: { totalDrafted: 6, qualityPassed: 5, qualityFailed: 1, passRate: 83.3, topFailureReasons: [] },
      resolution: { resolvedCount: 3, avgAdmittedToSentHours: 1.5, avgAdmittedToResolvedHours: 3.2 },
      admission: {
        totalProcessed: 12,
        admitted: 8,
        admittedRate: 66.7,
        autoArchived: 3,
        autoArchivedRate: 25,
        reviewLater: 1,
        reviewLaterRate: 8.3,
      },
      period: { days: null },
    });

    const response = await GET(
      buildGetRequest("http://localhost/api/mcp/inbox/analytics"),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.volume).toBeDefined();
    expect(payload.data.quality).toBeDefined();
    expect(payload.data.resolution).toBeDefined();
    expect(payload.data.admission).toBeDefined();
    expect(computeAnalyticsMock).toHaveBeenCalledWith({
      days: undefined,
      metrics: undefined,
    });
  });

  // TC-02: metrics=volume,quality returns only those groups
  it("passes selected metrics to computeAnalytics", async () => {
    computeAnalyticsMock.mockResolvedValue({
      volume: { totalThreads: 5, admitted: 4, drafted: 3, sent: 2, resolved: 1 },
      quality: { totalDrafted: 3, qualityPassed: 2, qualityFailed: 1, passRate: 66.7, topFailureReasons: [] },
      period: { days: null },
    });

    const response = await GET(
      buildGetRequest("http://localhost/api/mcp/inbox/analytics?metrics=volume,quality"),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(computeAnalyticsMock).toHaveBeenCalledWith({
      days: undefined,
      metrics: ["volume", "quality"],
    });
  });

  // TC-03: days=7 filters metrics
  it("passes days parameter to computeAnalytics", async () => {
    computeAnalyticsMock.mockResolvedValue({
      volume: { totalThreads: 2, admitted: 2, drafted: 1, sent: 1, resolved: 0 },
      period: { days: 7 },
    });

    const response = await GET(
      buildGetRequest("http://localhost/api/mcp/inbox/analytics?days=7"),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.period.days).toBe(7);
    expect(computeAnalyticsMock).toHaveBeenCalledWith(
      expect.objectContaining({ days: 7 }),
    );
  });

  // TC-04: Invalid days returns 400
  it("returns 400 for invalid days parameter", async () => {
    const response = await GET(
      buildGetRequest("http://localhost/api/mcp/inbox/analytics?days=-1"),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.success).toBe(false);
    expect(payload.error).toContain("days must be a positive integer");
    expect(computeAnalyticsMock).not.toHaveBeenCalled();
  });

  // TC-05: Unauthenticated request returns 401
  it("returns 401 when not authenticated", async () => {
    requireStaffAuthMock.mockResolvedValue({
      ok: false,
      response: new Response(
        JSON.stringify({ success: false, error: "Missing bearer token" }),
        { status: 401 },
      ),
    });

    const response = await GET(
      buildGetRequest("http://localhost/api/mcp/inbox/analytics"),
    );

    expect(response.status).toBe(401);
    expect(computeAnalyticsMock).not.toHaveBeenCalled();
  });

  // TC-06: Computation error returns 502 via inboxApiErrorResponse
  it("returns error response when computation throws", async () => {
    computeAnalyticsMock.mockRejectedValue(new Error("D1 query failed"));

    const response = await GET(
      buildGetRequest("http://localhost/api/mcp/inbox/analytics"),
    );
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload.success).toBe(false);
    expect(payload.error).toContain("D1 query failed");
  });

  it("ignores unknown metric names in the metrics parameter", async () => {
    computeAnalyticsMock.mockResolvedValue({
      volume: { totalThreads: 1, admitted: 1, drafted: 0, sent: 0, resolved: 0 },
      period: { days: null },
    });

    const response = await GET(
      buildGetRequest("http://localhost/api/mcp/inbox/analytics?metrics=volume,foobar"),
    );

    expect(response.status).toBe(200);
    expect(computeAnalyticsMock).toHaveBeenCalledWith({
      days: undefined,
      metrics: ["volume"],
    });
  });

  it("returns 400 for non-numeric days parameter", async () => {
    const response = await GET(
      buildGetRequest("http://localhost/api/mcp/inbox/analytics?days=abc"),
    );

    expect(response.status).toBe(400);
    expect(computeAnalyticsMock).not.toHaveBeenCalled();
  });
});
