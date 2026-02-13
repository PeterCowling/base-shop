/** @jest-environment node */

import { promises as fs } from "fs";
import os from "os";
import path from "path";

import { projectZoneTrafficMetrics } from "../../../mcp-cloudflare/src/tools/analytics";
import {
  parseMetricsRegistry,
  parseWave2MetricRecord,
  validateMetricRecordAgainstRegistry,
} from "../lib/wave2-contracts";
import { handleBosTool } from "../tools/bos";
import { handleLoopTool } from "../tools/loop";

const FIXTURE_ROOT = path.join(process.cwd(), "packages/mcp-server/src/__tests__/fixtures");
const BOS_FIXTURES = path.join(FIXTURE_ROOT, "bos-api");
const LOOP_FIXTURES = path.join(FIXTURE_ROOT, "startup-loop");

type BosStatusCase = "success" | "auth" | "not-found" | "conflict" | "unavailable";

type MockResponse = {
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<unknown>;
};

function makeJsonResponse(status: number, body: unknown): MockResponse {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText:
      status === 200
        ? "OK"
        : status === 401
          ? "Unauthorized"
          : status === 404
            ? "Not Found"
            : status === 409
              ? "Conflict"
              : "Service Unavailable",
    json: async () => body,
  };
}

async function readFixtureJson<T>(directory: string, fileName: string): Promise<T> {
  const content = await fs.readFile(path.join(directory, fileName), "utf-8");
  return JSON.parse(content) as T;
}

async function writeFixtureFile(sourcePath: string, targetPath: string) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  const content = await fs.readFile(sourcePath, "utf-8");
  await fs.writeFile(targetPath, content, "utf-8");
}

async function writeMetricsFile(
  targetPath: string,
  rows: Array<{ timestamp: string; metric_name: string; value: number; run_id?: string }>
) {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  const content = rows
    .map((row) =>
      JSON.stringify({
        timestamp: row.timestamp,
        run_id: row.run_id ?? "run-001",
        metric_name: row.metric_name,
        value: row.value,
      })
    )
    .join("\n");
  await fs.writeFile(targetPath, `${content}\n`, "utf-8");
}

function parseResultPayload(result: { content: Array<{ text: string }> }) {
  return JSON.parse(result.content[0].text) as Record<string, unknown>;
}

async function runTc08RefreshLifecycle(tempRoot: string): Promise<void> {
  const runRoot = path.join(
    tempRoot,
    "docs/business-os/startup-baselines/BRIK/runs/run-001"
  );
  const businessRoot = path.join(tempRoot, "docs/business-os/startup-baselines/BRIK");

  await writeFixtureFile(
    path.join(LOOP_FIXTURES, "manifest.complete.json"),
    path.join(runRoot, "baseline.manifest.json")
  );
  await writeFixtureFile(
    path.join(LOOP_FIXTURES, "metrics.partial.jsonl"),
    path.join(runRoot, "metrics.jsonl")
  );

  const enqueueFirst = await handleLoopTool("refresh_enqueue_guarded", {
    business: "BRIK",
    runId: "run-001",
    current_stage: "S7",
    collector: "metrics",
    requestId: "req-refresh-001",
    write_reason: "manual refresh request from startup loop",
    reason: "collector stale",
    requestedBy: "startup-loop",
  });
  const enqueueFirstPayload = parseResultPayload(enqueueFirst);
  expect(enqueueFirst.isError).toBeUndefined();
  expect(enqueueFirstPayload.refreshRequest).toEqual(
    expect.objectContaining({
      requestId: "req-refresh-001",
      state: "enqueued",
    })
  );

  const queuePath = String(enqueueFirstPayload.queuePath);
  const queueStatBefore = await fs.stat(queuePath);

  const enqueueDuplicate = await handleLoopTool("refresh_enqueue_guarded", {
    business: "BRIK",
    runId: "run-001",
    current_stage: "S7",
    collector: "metrics",
    requestId: "req-refresh-001",
    write_reason: "duplicate enqueue should be idempotent",
    reason: "collector stale",
    requestedBy: "startup-loop",
  });
  const enqueueDuplicatePayload = parseResultPayload(enqueueDuplicate);
  expect(enqueueDuplicatePayload.idempotent).toBe(true);
  expect(enqueueDuplicatePayload.refreshRequest).toEqual(
    expect.objectContaining({
      requestId: "req-refresh-001",
      state: "enqueued",
    })
  );

  const queueStatAfter = await fs.stat(queuePath);
  expect(queueStatAfter.mtimeMs).toBe(queueStatBefore.mtimeMs);

  const transitionPending = await handleLoopTool("refresh_enqueue_guarded", {
    business: "BRIK",
    runId: "run-001",
    current_stage: "S7",
    collector: "metrics",
    requestId: "req-refresh-001",
    write_reason: "collector accepted refresh request",
    reason: "collector queue accepted",
    requestedBy: "startup-loop",
    transitionTo: "pending",
  });
  const transitionPendingPayload = parseResultPayload(transitionPending);
  expect(transitionPendingPayload.refreshRequest.state).toBe("pending");

  const transitionRunning = await handleLoopTool("refresh_enqueue_guarded", {
    business: "BRIK",
    runId: "run-001",
    current_stage: "S7",
    collector: "metrics",
    requestId: "req-refresh-001",
    write_reason: "collector running request",
    reason: "collector worker started",
    requestedBy: "startup-loop",
    transitionTo: "running",
  });
  const transitionRunningPayload = parseResultPayload(transitionRunning);
  expect(transitionRunningPayload.refreshRequest.state).toBe("running");

  const collectorStatusPath = path.join(
    businessRoot,
    "refresh",
    "collectors",
    "metrics.status.json"
  );
  await fs.mkdir(path.dirname(collectorStatusPath), { recursive: true });
  await fs.writeFile(
    collectorStatusPath,
    JSON.stringify(
      {
        schemaVersion: "refresh.collector.status.v1",
        collector: "metrics",
        state: "failed",
        lastRunAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-01T00:00:00Z",
        error: {
          code: "UPSTREAM_TIMEOUT",
          message: "collector timed out waiting for upstream",
        },
      },
      null,
      2
    ),
    "utf-8"
  );

  process.env.REFRESH_STATUS_STALE_THRESHOLD_SECONDS = "60";

  const refreshStatus = await handleLoopTool("refresh_status_get", {
    business: "BRIK",
    runId: "run-001",
    current_stage: "S7",
    collector: "metrics",
  });
  const refreshStatusPayload = parseResultPayload(refreshStatus);
  expect(refreshStatusPayload.freshness).toEqual(
    expect.objectContaining({
      status: "stale",
    })
  );
  expect(Number(refreshStatusPayload.lagSeconds)).toBeGreaterThan(60);
  expect(refreshStatusPayload.collector).toEqual(
    expect.objectContaining({
      state: "failed",
    })
  );
  expect(refreshStatusPayload.collector.error).toEqual(
    expect.objectContaining({
      code: "UPSTREAM_TIMEOUT",
    })
  );
}

async function runTc09AnomalyDetectors(tempRoot: string): Promise<void> {
  const runRoot = path.join(
    tempRoot,
    "docs/business-os/startup-baselines/BRIK/runs/run-001"
  );
  const metricsPath = path.join(runRoot, "metrics.jsonl");

  await writeFixtureFile(
    path.join(LOOP_FIXTURES, "manifest.complete.json"),
    path.join(runRoot, "baseline.manifest.json")
  );

  await writeMetricsFile(metricsPath, [
    { timestamp: "2026-02-01T00:00:00Z", metric_name: "traffic_requests", value: 100 },
    { timestamp: "2026-02-02T00:00:00Z", metric_name: "traffic_requests", value: 101 },
    { timestamp: "2026-02-03T00:00:00Z", metric_name: "traffic_requests", value: 99 },
  ]);

  const coldStart = await handleLoopTool("anomaly_detect_traffic", {
    business: "BRIK",
    runId: "run-001",
    current_stage: "S7",
    grain: "day",
  });
  const coldStartPayload = parseResultPayload(coldStart);
  expect(coldStartPayload.quality).toBe("blocked");
  expect(coldStartPayload.severity).toBeNull();
  expect(coldStartPayload.qualityNotes).toContain("insufficient-history");

  const fullSeries = Array.from({ length: 30 }).map((_, index) => ({
    timestamp: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
    metric_name: "traffic_requests",
    value: index === 29 ? 280 : 100 + (index % 3),
  }));
  await writeMetricsFile(metricsPath, fullSeries);

  const warmSeries = await handleLoopTool("anomaly_detect_traffic", {
    business: "BRIK",
    runId: "run-001",
    current_stage: "S7",
    grain: "day",
  });
  const warmSeriesPayload = parseResultPayload(warmSeries);
  expect(warmSeriesPayload.quality).toBe("ok");
  expect(["moderate", "critical"]).toContain(String(warmSeriesPayload.severity));
  expect(warmSeriesPayload.detector).toEqual(
    expect.objectContaining({
      schemaVersion: "anomaly.detector.v1",
      primary: "ewma-zscore.v1",
    })
  );
  expect(warmSeriesPayload.detector.methods).toEqual(
    expect.arrayContaining(["ewma", "zscore"])
  );
}

describe("startup-loop MCP integration suite", () => {
  const originalFetch = global.fetch;
  const originalBaseUrl = process.env.BOS_AGENT_API_BASE_URL;
  const originalApiKey = process.env.BOS_AGENT_API_KEY;
  const originalArtifactRoot = process.env.STARTUP_LOOP_ARTIFACT_ROOT;
  const originalStaleThreshold = process.env.STARTUP_LOOP_STALE_THRESHOLD_SECONDS;
  const originalRefreshStatusStaleThreshold = process.env.REFRESH_STATUS_STALE_THRESHOLD_SECONDS;

  let tempRoot = "";
  let bosStatusCase: BosStatusCase = "success";

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-startup-loop-integration-"));
    process.env.BOS_AGENT_API_BASE_URL = "http://localhost:3020";
    process.env.BOS_AGENT_API_KEY = "bos_test_key_1234567890";
    process.env.STARTUP_LOOP_ARTIFACT_ROOT = tempRoot;
    process.env.STARTUP_LOOP_STALE_THRESHOLD_SECONDS = "2592000";
    bosStatusCase = "success";

    const fixtures = {
      cards: await readFixtureJson<Record<string, unknown>>(BOS_FIXTURES, "cards-list.success.json"),
      stageDocGet: await readFixtureJson<Record<string, unknown>>(BOS_FIXTURES, "stage-doc.get.success.json"),
      stageDocPatch: await readFixtureJson<Record<string, unknown>>(BOS_FIXTURES, "stage-doc.patch.success.json"),
      conflict: await readFixtureJson<Record<string, unknown>>(
        BOS_FIXTURES,
        "stage-doc.patch.conflict.json"
      ),
      error401: await readFixtureJson<Record<string, unknown>>(BOS_FIXTURES, "error.401.json"),
      error404: await readFixtureJson<Record<string, unknown>>(BOS_FIXTURES, "error.404.json"),
      error500: await readFixtureJson<Record<string, unknown>>(BOS_FIXTURES, "error.500.json"),
    };

    global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = (init?.method ?? "GET").toUpperCase();

      if (bosStatusCase === "auth") {
        return makeJsonResponse(401, fixtures.error401);
      }
      if (bosStatusCase === "unavailable") {
        return makeJsonResponse(503, fixtures.error500);
      }

      if (method === "GET" && url.includes("/api/agent/cards")) {
        return makeJsonResponse(200, fixtures.cards);
      }

      if (method === "GET" && url.includes("/api/agent/stage-docs/")) {
        if (bosStatusCase === "not-found") {
          return makeJsonResponse(404, fixtures.error404);
        }
        return makeJsonResponse(200, fixtures.stageDocGet);
      }

      if (method === "PATCH" && url.includes("/api/agent/stage-docs/")) {
        if (bosStatusCase === "conflict") {
          return makeJsonResponse(409, fixtures.conflict);
        }
        return makeJsonResponse(200, fixtures.stageDocPatch);
      }

      return makeJsonResponse(404, fixtures.error404);
    }) as unknown as typeof fetch;
  });

  afterEach(async () => {
    process.env.BOS_AGENT_API_BASE_URL = originalBaseUrl;
    process.env.BOS_AGENT_API_KEY = originalApiKey;
    process.env.STARTUP_LOOP_ARTIFACT_ROOT = originalArtifactRoot;
    process.env.STARTUP_LOOP_STALE_THRESHOLD_SECONDS = originalStaleThreshold;
    process.env.REFRESH_STATUS_STALE_THRESHOLD_SECONDS = originalRefreshStatusStaleThreshold;
    global.fetch = originalFetch;
    await fs.rm(tempRoot, { recursive: true, force: true });
    jest.resetAllMocks();
  });

  it("TC-01: BOS read tools succeed with fixture-backed API stubs", async () => {
    const cards = await handleBosTool("bos_cards_list", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "S7",
    });

    const stageDoc = await handleBosTool("bos_stage_doc_get", {
      business: "BRIK",
      cardId: "BRIK-ENG-0001",
      stage: "plan",
      runId: "run-001",
      current_stage: "S7",
    });

    const cardsPayload = parseResultPayload(cards);
    const stageDocPayload = parseResultPayload(stageDoc);

    expect(cardsPayload.count).toBe(1);
    expect(stageDocPayload.stageDoc).toEqual(
      expect.objectContaining({
        cardId: "BRIK-ENG-0001",
        entitySha: "sha-plan-current",
      })
    );
  });

  it("TC-02: guarded write success path returns updated entitySha", async () => {
    const result = await handleBosTool("bos_stage_doc_patch_guarded", {
      business: "BRIK",
      cardId: "BRIK-ENG-0001",
      stage: "plan",
      runId: "run-001",
      current_stage: "S7",
      write_reason: "sync plan stage doc",
      baseEntitySha: "sha-plan-current",
      patch: { content: "# Planned\n\nUpdated from MCP write." },
    });

    const payload = parseResultPayload(result);
    expect(payload.stageDoc).toEqual(
      expect.objectContaining({
        entitySha: "sha-plan-next",
      })
    );
  });

  it("TC-03: guarded write stale-sha path returns CONFLICT_ENTITY_SHA", async () => {
    bosStatusCase = "conflict";

    const result = await handleBosTool("bos_stage_doc_patch_guarded", {
      business: "BRIK",
      cardId: "BRIK-ENG-0001",
      stage: "plan",
      runId: "run-001",
      current_stage: "S7",
      write_reason: "sync plan stage doc",
      baseEntitySha: "sha-stale",
      patch: { content: "# Planned\n\nUpdated from MCP write." },
    });

    const payload = parseResultPayload(result);
    expect(result.isError).toBe(true);
    expect(payload.error).toEqual(
      expect.objectContaining({
        code: "CONFLICT_ENTITY_SHA",
      })
    );
  });

  it("TC-04: stage-forbidden write returns FORBIDDEN_STAGE without side effects", async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;

    const result = await handleBosTool("bos_stage_doc_patch_guarded", {
      business: "BRIK",
      cardId: "BRIK-ENG-0001",
      stage: "plan",
      runId: "run-001",
      current_stage: "S2A",
      write_reason: "sync plan stage doc",
      baseEntitySha: "sha-plan-current",
      patch: { content: "# Planned\n\nUpdated from MCP write." },
    });

    const payload = parseResultPayload(result);
    expect(result.isError).toBe(true);
    expect(payload.error).toEqual(
      expect.objectContaining({
        code: "FORBIDDEN_STAGE",
      })
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("TC-05: loop tools cover missing + complete + stale fixture states", async () => {
    const missing = await handleLoopTool("loop_manifest_status", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "S7",
    });
    const missingPayload = parseResultPayload(missing);
    expect(missing.isError).toBe(true);
    expect(missingPayload.error).toEqual(
      expect.objectContaining({
        code: "MISSING_ARTIFACT",
      })
    );

    const runRoot = path.join(
      tempRoot,
      "docs/business-os/startup-baselines/BRIK/runs/run-001"
    );
    const businessRoot = path.join(tempRoot, "docs/business-os/startup-baselines/BRIK");

    await writeFixtureFile(
      path.join(LOOP_FIXTURES, "manifest.complete.json"),
      path.join(runRoot, "baseline.manifest.json")
    );
    await writeFixtureFile(
      path.join(LOOP_FIXTURES, "learning-ledger.complete.jsonl"),
      path.join(businessRoot, "learning-ledger.jsonl")
    );
    await writeFixtureFile(
      path.join(LOOP_FIXTURES, "metrics.partial.jsonl"),
      path.join(runRoot, "metrics.jsonl")
    );

    const complete = await handleLoopTool("loop_manifest_status", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "S7",
    });
    const completePayload = parseResultPayload(complete);
    expect(complete.isError).toBeUndefined();
    expect(completePayload.freshness).toEqual(
      expect.objectContaining({
        status: expect.any(String),
      })
    );

    await writeFixtureFile(
      path.join(LOOP_FIXTURES, "manifest.stale.json"),
      path.join(runRoot, "baseline.manifest.json")
    );
    process.env.STARTUP_LOOP_STALE_THRESHOLD_SECONDS = "60";

    const stale = await handleLoopTool("loop_manifest_status", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "S7",
    });
    const stalePayload = parseResultPayload(stale);
    expect(stalePayload.freshness).toEqual(
      expect.objectContaining({
        status: "stale",
      })
    );
  });

  it("TC-06: startup-loop Jest wrapper config captures stable ignore patterns", async () => {
    const configPath = path.join(process.cwd(), "packages/mcp-server/jest.startup-loop.config.cjs");
    const configText = await fs.readFile(configPath, "utf-8");

    expect(configText).toContain(".open-next");
    expect(configText).toContain(".worktrees");
    expect(configText).toContain(".ts-jest");
    expect(configText).toContain("startup-loop-tools.integration.test.ts");
  });

  it("TC-07: wave-2 vertical slice builds deterministic packet and pack artifacts", async () => {
    const runRoot = path.join(
      tempRoot,
      "docs/business-os/startup-baselines/BRIK/runs/run-001"
    );

    await writeFixtureFile(
      path.join(LOOP_FIXTURES, "manifest.complete.json"),
      path.join(runRoot, "baseline.manifest.json")
    );
    await writeFixtureFile(
      path.join(LOOP_FIXTURES, "metrics.partial.jsonl"),
      path.join(runRoot, "metrics.jsonl")
    );

    const measure = await handleLoopTool("measure_snapshot_get", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "S7",
    });
    const measurePayload = parseResultPayload(measure);
    expect(measurePayload.recordCount).toBeGreaterThan(0);

    const packetOne = await handleLoopTool("app_run_packet_build", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "S7",
    });
    const packetTwo = await handleLoopTool("app_run_packet_build", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "S7",
    });

    const packetOnePayload = parseResultPayload(packetOne);
    const packetTwoPayload = parseResultPayload(packetTwo);
    expect(packetOnePayload.packetId).toBe(packetTwoPayload.packetId);
    expect(packetOnePayload.sizeBytes).toBe(packetTwoPayload.sizeBytes);
    expect(packetOnePayload.provenance).toEqual(packetTwoPayload.provenance);

    const packetGet = await handleLoopTool("app_run_packet_get", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "S7",
      packetId: packetOnePayload.packetId,
    });
    const packetGetPayload = parseResultPayload(packetGet);
    expect(packetGetPayload.packetId).toBe(packetOnePayload.packetId);

    const packOne = await handleLoopTool("pack_weekly_s10_build", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "S7",
      packetId: packetOnePayload.packetId,
    });
    const packTwo = await handleLoopTool("pack_weekly_s10_build", {
      business: "BRIK",
      runId: "run-001",
      current_stage: "S7",
      packetId: packetOnePayload.packetId,
    });

    const packOnePayload = parseResultPayload(packOne);
    const packTwoPayload = parseResultPayload(packTwo);
    expect(packOnePayload.provenance).toEqual(packTwoPayload.provenance);
    expect(packOnePayload.packJsonPath).toBe(packTwoPayload.packJsonPath);
    expect(packOnePayload.packMarkdownPath).toBe(packTwoPayload.packMarkdownPath);

    const packJsonPath = String(packOnePayload.packJsonPath);
    const packMarkdownPath = String(packOnePayload.packMarkdownPath);
    const jsonOne = await fs.readFile(packJsonPath, "utf-8");
    const jsonTwo = await fs.readFile(String(packTwoPayload.packJsonPath), "utf-8");
    const markdownOne = await fs.readFile(packMarkdownPath, "utf-8");
    const markdownTwo = await fs.readFile(String(packTwoPayload.packMarkdownPath), "utf-8");
    expect(jsonOne).toBe(jsonTwo);
    expect(markdownOne).toBe(markdownTwo);
  });

  it("TC-08: refresh lifecycle is idempotent and stale collector status includes lag/error detail", async () => {
    await runTc08RefreshLifecycle(tempRoot);
  });

  it("TC-09: anomaly detectors enforce cold-start baseline gate and emit detector metadata", async () => {
    await runTc09AnomalyDetectors(tempRoot);
  });
});

describe("cloudflare adapter contract harness", () => {
  it("TC-10: projected Cloudflare metrics pass registry validation and fail on mismatches", () => {
    const registry = parseMetricsRegistry({
      schemaVersion: "metrics-registry.v1",
      metrics: [
        {
          metric: "traffic_requests_total",
          valueType: "count",
          unit: "count",
          preferredGrains: ["day"],
          defaultWindow: "7d",
          allowedDimensions: ["provider", "zoneId"],
          aggregationMethod: "sum",
          sourcePriority: ["cloudflare"],
          piiRisk: "low",
        },
        {
          metric: "traffic_requests_cached",
          valueType: "count",
          unit: "count",
          preferredGrains: ["day"],
          defaultWindow: "7d",
          allowedDimensions: ["provider", "zoneId"],
          aggregationMethod: "sum",
          sourcePriority: ["cloudflare"],
          piiRisk: "low",
        },
        {
          metric: "traffic_bandwidth_total_bytes",
          valueType: "count",
          unit: "bytes",
          preferredGrains: ["day"],
          defaultWindow: "7d",
          allowedDimensions: ["provider", "zoneId"],
          aggregationMethod: "sum",
          sourcePriority: ["cloudflare"],
          piiRisk: "low",
        },
        {
          metric: "traffic_threats_total",
          valueType: "count",
          unit: "count",
          preferredGrains: ["day"],
          defaultWindow: "7d",
          allowedDimensions: ["provider", "zoneId"],
          aggregationMethod: "sum",
          sourcePriority: ["cloudflare"],
          piiRisk: "low",
        },
        {
          metric: "traffic_cache_hit_ratio",
          valueType: "ratio",
          unit: "ratio",
          preferredGrains: ["day"],
          defaultWindow: "7d",
          allowedDimensions: ["provider", "zoneId"],
          aggregationMethod: "ratio",
          sourcePriority: ["cloudflare"],
          piiRisk: "low",
        },
      ],
    });

    const projected = projectZoneTrafficMetrics({
      zoneId: "zone_123",
      totals: {
        requests: 1000,
        cachedRequests: 700,
        bytes: 900000,
        cachedBytes: 600000,
        threats: 8,
        pageViews: 420,
        uniques: 300,
      },
    });

    const validRecord = parseWave2MetricRecord({
      schemaVersion: "measure.record.v1",
      business: "BRIK",
      source: "cloudflare",
      metric: projected[0].metric,
      window: {
        startAt: "2026-02-01T00:00:00Z",
        endAt: "2026-02-01T00:00:00Z",
        grain: projected[0].grain,
        timezone: "UTC",
      },
      segmentSchemaVersion: "segments.v1",
      segments: projected[0].segments,
      valueType: projected[0].valueType,
      value: projected[0].value,
      unit: projected[0].unit,
      quality: "ok",
      qualityNotes: [],
      coverage: {
        expectedPoints: 1,
        observedPoints: 1,
        samplingFraction: 1,
      },
      refreshedAt: "2026-02-01T00:00:00Z",
      provenance: {
        schemaVersion: "provenance.v1",
        querySignature: "sha256:cloudflare-contract",
        generatedAt: "2026-02-01T00:00:00Z",
        datasetId: "cloudflare-zone-123",
        sourceRef: "analytics_zone_traffic",
        artifactRefs: ["artifact://cloudflare/zone_123/traffic"],
        quality: "ok",
      },
    });

    expect(() => validateMetricRecordAgainstRegistry(validRecord, registry)).not.toThrow();

    const invalidUnitRecord = {
      ...validRecord,
      unit: "ratio",
    };
    expect(() =>
      validateMetricRecordAgainstRegistry(parseWave2MetricRecord(invalidUnitRecord), registry)
    ).toThrow(/unit/i);

    const invalidDimensionRecord = {
      ...validRecord,
      segments: {
        provider: "cloudflare",
        zoneId: "zone_123",
        colo: "LHR",
      },
    };
    expect(() =>
      validateMetricRecordAgainstRegistry(parseWave2MetricRecord(invalidDimensionRecord), registry)
    ).toThrow(/dimension/i);
  });
});
