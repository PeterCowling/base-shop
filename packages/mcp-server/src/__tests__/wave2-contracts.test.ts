/** @jest-environment node */

import {
  DEFAULT_PACKET_REDACTION_POLICY,
  determineWave2Quality,
  evaluateAnomalyBaseline,
  parseMetricsRegistry,
  parseWave2Envelope,
  parseWave2MetricRecord,
  validateMetricRecordAgainstRegistry,
  validateRunPacketBounds,
} from "../lib/wave2-contracts";

describe("wave2 contracts", () => {
  const registry = parseMetricsRegistry({
    schemaVersion: "metrics-registry.v1",
    metrics: [
      {
        metric: "revenue",
        valueType: "currency",
        unit: "EUR",
        preferredGrains: ["day", "week"],
        defaultWindow: "28d",
        allowedDimensions: ["channel", "product"],
        aggregationMethod: "sum",
        sourcePriority: ["stripe", "d1"],
        piiRisk: "low",
      },
    ],
  });

  it("TC-01: metric record with invalid unit/dimension mapping fails validation", () => {
    const invalidUnit = {
      schemaVersion: "measure.record.v1",
      business: "BRIK",
      source: "stripe",
      metric: "revenue",
      window: {
        startAt: "2026-02-01T00:00:00Z",
        endAt: "2026-02-08T00:00:00Z",
        grain: "day",
        timezone: "UTC",
      },
      segmentSchemaVersion: "segments.v1",
      segments: { channel: "organic" },
      valueType: "currency",
      value: 123.45,
      unit: "USD",
      quality: "ok",
      qualityNotes: [],
      coverage: {
        expectedPoints: 7,
        observedPoints: 7,
        samplingFraction: 1,
      },
      refreshedAt: "2026-02-13T10:00:00Z",
      provenance: {
        schemaVersion: "provenance.v1",
        querySignature: "sha256:abc",
        generatedAt: "2026-02-13T10:00:00Z",
        datasetId: "ds1",
        sourceRef: "stripe/revenue",
        artifactRefs: ["artifact://collectors/stripe/revenue-2026-02-13.json"],
        quality: "ok",
      },
    };

    const invalidDimension = {
      ...invalidUnit,
      unit: "EUR",
      segments: {
        channel: "organic",
        device: "mobile",
      },
    };

    expect(() =>
      validateMetricRecordAgainstRegistry(parseWave2MetricRecord(invalidUnit), registry)
    ).toThrow(/unit/i);

    expect(() =>
      validateMetricRecordAgainstRegistry(parseWave2MetricRecord(invalidDimension), registry)
    ).toThrow(/dimension/i);
  });

  it("TC-02: packet exceeding max size or top-k caps is rejected", () => {
    const tooManyPages = {
      schemaVersion: "run.packet.v1",
      packetId: "RPK-BRIK-20260213-1000",
      source: "app_run_packet_build",
      timeWindow: { start: "2026-02-06", end: "2026-02-13" },
      segments: { business: "BRIK" },
      sizeBytes: 100,
      sizeBudgetBytes: 262144,
      redactionApplied: true,
      redactionRulesVersion: "packet-redaction.v1",
      data: {
        bookingsSummary: {},
        funnelStats: {},
        inventoryDeltas: {},
        pricingTables: {},
        topPages: Array.from({ length: DEFAULT_PACKET_REDACTION_POLICY.maxTopPages + 1 }).map(
          (_, i) => `/${i}`
        ),
        topQueries: [],
        topSupportIssues: [],
      },
      sourceRefs: {},
      refreshedAt: "2026-02-13T10:00:00Z",
      quality: "ok",
      qualityNotes: [],
      coverage: {
        expectedPoints: 7,
        observedPoints: 7,
        samplingFraction: 1,
      },
      provenance: {
        schemaVersion: "provenance.v1",
        querySignature: "sha256:abc",
        generatedAt: "2026-02-13T10:00:00Z",
        datasetId: "ds1",
        sourceRef: "packet/build",
        artifactRefs: ["artifact://run-packets/RPK-BRIK-20260213-1000.json"],
        quality: "ok",
      },
    };

    const oversized = {
      ...tooManyPages,
      sizeBytes: DEFAULT_PACKET_REDACTION_POLICY.maxPacketSizeBytes + 1,
      data: {
        ...tooManyPages.data,
        topPages: [],
      },
    };

    expect(() => validateRunPacketBounds(tooManyPages)).toThrow(/topPages/i);
    expect(() => validateRunPacketBounds(oversized)).toThrow(/maxPacketSizeBytes/i);
  });

  it("TC-03: missing provenance keys fails envelope parsing", () => {
    const invalidEnvelope = {
      schemaVersion: "measure.snapshot.v1",
      refreshedAt: "2026-02-13T10:00:00Z",
      quality: "ok",
      qualityNotes: [],
      coverage: {
        expectedPoints: 7,
        observedPoints: 7,
        samplingFraction: 1,
      },
      provenance: {
        schemaVersion: "provenance.v1",
        generatedAt: "2026-02-13T10:00:00Z",
        datasetId: "ds1",
        sourceRef: "stripe/revenue",
        artifactRefs: ["artifact://collectors/stripe/revenue-2026-02-13.json"],
        quality: "ok",
      },
    };

    expect(() => parseWave2Envelope(invalidEnvelope)).toThrow(/querySignature/i);
  });

  it("TC-04: quality thresholds and anomaly baseline gates are deterministic", () => {
    expect(
      determineWave2Quality({
        expectedPoints: 100,
        observedPoints: 95,
      })
    ).toBe("ok");

    expect(
      determineWave2Quality({
        expectedPoints: 100,
        observedPoints: 60,
      })
    ).toBe("partial");

    expect(
      determineWave2Quality({
        expectedPoints: 100,
        observedPoints: 40,
      })
    ).toBe("blocked");

    expect(
      evaluateAnomalyBaseline({ grain: "day", observedPoints: 27 }).eligible
    ).toBe(false);

    expect(
      evaluateAnomalyBaseline({ grain: "day", observedPoints: 28 }).eligible
    ).toBe(true);
  });
});
