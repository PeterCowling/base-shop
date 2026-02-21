/** @jest-environment node */

import { cfFetch } from "../client";

import { CLOUDFLARE_MEASURE_CONTRACT_VERSION, handleAnalyticsTool, projectZoneTrafficMetrics } from "./analytics";

jest.mock("../client", () => ({
  cfFetch: jest.fn(),
  getAccountId: jest.fn(() => "acct_test"),
}));

function parsePayload(result: { content: Array<{ text: string }> }) {
  return JSON.parse(result.content[0].text) as Record<string, unknown>;
}

describe("cloudflare analytics contract harness", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("TC-01: projects deterministic Cloudflare traffic metrics for wave-2 adapters", () => {
    const projection = projectZoneTrafficMetrics({
      zoneId: "zone_123",
      totals: {
        requests: 1200,
        cachedRequests: 900,
        bytes: 800000,
        cachedBytes: 600000,
        threats: 17,
        pageViews: 450,
        uniques: 320,
      },
    });

    expect(projection.map((record) => record.metric)).toEqual([
      "traffic_requests_total",
      "traffic_requests_cached",
      "traffic_bandwidth_total_bytes",
      "traffic_threats_total",
      "traffic_cache_hit_ratio",
    ]);
    expect(projection.find((record) => record.metric === "traffic_cache_hit_ratio")?.value).toBe(0.75);
  });

  it("TC-02: analytics_zone_traffic exposes normalized metrics on GraphQL success path", async () => {
    const cfFetchMock = cfFetch as jest.Mock;
    cfFetchMock.mockResolvedValue({
      viewer: {
        zones: [
          {
            httpRequests1dGroups: [
              {
                sum: {
                  requests: 300,
                  cachedRequests: 210,
                  bytes: 200000,
                  cachedBytes: 120000,
                  threats: 5,
                  pageViews: 110,
                },
                uniq: {
                  uniques: 90,
                },
              },
            ],
          },
        ],
      },
    });

    const result = await handleAnalyticsTool("analytics_zone_traffic", {
      zoneId: "zone_123",
      since: "2026-02-01",
      until: "2026-02-07",
    });

    const payload = parsePayload(result);
    expect(payload.contractVersion).toBe(CLOUDFLARE_MEASURE_CONTRACT_VERSION);
    expect(payload.normalizedMetrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          metric: "traffic_requests_total",
          value: 300,
          unit: "count",
        }),
        expect.objectContaining({
          metric: "traffic_cache_hit_ratio",
          value: 0.7,
          unit: "ratio",
        }),
      ])
    );
  });

  it("TC-03: analytics_zone_traffic fallback path still emits normalized metrics", async () => {
    const cfFetchMock = cfFetch as jest.Mock;
    cfFetchMock
      .mockRejectedValueOnce(new Error("GraphQL unavailable"))
      .mockResolvedValueOnce({
        totals: {
          requests: { all: 120, cached: 72, uncached: 48, ssl: { encrypted: 0, unencrypted: 0 } },
          bandwidth: { all: 20000, cached: 8000, uncached: 12000 },
          threats: { all: 2, type: {} },
          pageviews: { all: 55 },
          uniques: { all: 31 },
        },
      });

    const result = await handleAnalyticsTool("analytics_zone_traffic", {
      zoneId: "zone_123",
      since: "-7d",
      until: "now",
    });

    const payload = parsePayload(result);
    expect(payload.contractVersion).toBe(CLOUDFLARE_MEASURE_CONTRACT_VERSION);
    expect(payload.normalizedMetrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          metric: "traffic_requests_total",
          value: 120,
        }),
        expect.objectContaining({
          metric: "traffic_cache_hit_ratio",
          value: 0.6,
        }),
      ])
    );
  });
});
