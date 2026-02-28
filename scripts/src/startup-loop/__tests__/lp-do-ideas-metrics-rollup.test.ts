import { describe, expect, it } from "@jest/globals";

import { rollupIdeasMetrics } from "../lp-do-ideas-metrics-rollup.js";
import {
  type IdeasCycleTelemetrySnapshot,
  type QueueEntrySnapshot,
} from "../lp-do-ideas-metrics-rollup.js";

function snapshot(
  overrides: Partial<IdeasCycleTelemetrySnapshot>,
): IdeasCycleTelemetrySnapshot {
  return {
    cycle_id: "cycle-001",
    phase: "P2",
    mode: "enforced",
    root_event_ids: ["root-1"],
    candidate_count: 1,
    admitted_cluster_count: 1,
    suppression_reason_counts: {},
    ...overrides,
  };
}

function queueEntry(overrides: Partial<QueueEntrySnapshot>): QueueEntrySnapshot {
  return {
    dispatch_id: "IDEA-DISPATCH-20260225000000-0001",
    lane: "DO",
    queue_state: "enqueued",
    event_timestamp: "2026-02-20T00:00:00.000Z",
    processing_timestamp: "2026-02-25T00:00:00.000Z",
    ...overrides,
  };
}

describe("rollupIdeasMetrics", () => {
  it("TC-10-01: computes deterministic rollup metrics from sample telemetry", () => {
    const snapshots: IdeasCycleTelemetrySnapshot[] = [
      snapshot({
        cycle_id: "cycle-001",
        phase: "P2",
        mode: "enforced",
        root_event_ids: ["root-1", "root-2", "root-2"],
        candidate_count: 3,
        admitted_cluster_count: 2,
        suppression_reason_counts: {
          lineage_depth_cap_exceeded: 1,
          cooldown_non_material: 1,
          non_material_delta: 1,
        },
      }),
      snapshot({
        cycle_id: "cycle-002",
        phase: "P3",
        mode: "enforced",
        root_event_ids: ["root-3"],
        candidate_count: 1,
        admitted_cluster_count: 1,
        suppression_reason_counts: {
          duplicate_event: 1,
        },
      }),
    ];

    const queueEntries: QueueEntrySnapshot[] = [
      queueEntry({
        dispatch_id: "d-1",
        lane: "DO",
        queue_state: "enqueued",
        event_timestamp: "2026-01-26T00:00:00.000Z",
      }),
      queueEntry({
        dispatch_id: "d-2",
        lane: "DO",
        queue_state: "enqueued",
        event_timestamp: "2026-02-15T00:00:00.000Z",
      }),
      queueEntry({
        dispatch_id: "d-3",
        lane: "IMPROVE",
        queue_state: "enqueued",
        event_timestamp: "2026-02-20T00:00:00.000Z",
      }),
      queueEntry({
        dispatch_id: "d-4",
        lane: "DO",
        queue_state: "processed",
      }),
      queueEntry({
        dispatch_id: "d-5",
        lane: "IMPROVE",
        queue_state: "processed",
      }),
      queueEntry({
        dispatch_id: "d-6",
        lane: "IMPROVE",
        queue_state: "processed",
      }),
    ];

    const report = rollupIdeasMetrics({
      cycle_snapshots: snapshots,
      queue_entries: queueEntries,
      now: new Date("2026-02-25T00:00:00.000Z"),
    });

    expect(report.root_event_count).toBe(3);
    expect(report.candidate_count).toBe(4);
    expect(report.admitted_cluster_count).toBe(3);
    expect(report.suppressed_by_loop_guards).toBe(4);
    expect(report.fan_out_raw).toBe(1.3333);
    expect(report.fan_out_admitted).toBe(1);
    expect(report.loop_incidence).toBe(1);
    expect(report.queue_age_p95_days.DO).toBe(30);
    expect(report.queue_age_p95_days.IMPROVE).toBe(5);
    expect(report.throughput).toBe(1.5);
    expect(report.lane_mix).toEqual({
      DO_completed: 1,
      IMPROVE_completed: 2,
      ratio: "1:2",
    });
    expect(report.suppression_by_invariant.same_origin_attach).toBe(1);
    expect(report.suppression_by_invariant.lineage_cap).toBe(1);
    expect(report.suppression_by_invariant.cooldown).toBe(1);
    expect(report.suppression_by_invariant.materiality).toBe(1);
  });

  it("TC-10-02: emits actionable threshold alerts on deterministic breaches", () => {
    const snapshots: IdeasCycleTelemetrySnapshot[] = [
      snapshot({
        cycle_id: "cycle-010",
        phase: "P2",
        root_event_ids: ["root-a"],
        candidate_count: 3,
        admitted_cluster_count: 2,
        suppression_reason_counts: {
          cooldown_non_material: 1,
          non_material_delta: 1,
        },
      }),
      snapshot({
        cycle_id: "cycle-011",
        phase: "P3",
        root_event_ids: ["root-b"],
        candidate_count: 4,
        admitted_cluster_count: 2,
        suppression_reason_counts: {
          cooldown_non_material: 1,
          non_material_delta: 1,
        },
      }),
    ];

    const queueEntries: QueueEntrySnapshot[] = [
      queueEntry({
        dispatch_id: "q-1",
        lane: "DO",
        queue_state: "enqueued",
        event_timestamp: "2026-01-30T00:00:00.000Z",
      }),
    ];

    const report = rollupIdeasMetrics({
      cycle_snapshots: snapshots,
      queue_entries: queueEntries,
      now: new Date("2026-02-25T00:00:00.000Z"),
    });

    const alertMetrics = report.action_records.map((record) => record.metric);
    expect(alertMetrics).toContain("fan_out_admitted");
    expect(alertMetrics).toContain("loop_incidence");
    expect(alertMetrics).toContain("queue_age_p95_days");
    expect(report.action_records.find((record) => record.metric === "fan_out_admitted")?.cycle_ids).toEqual([
      "cycle-010",
      "cycle-011",
    ]);
  });

  it("TC-10-03: root_event_count denominator uses unique root event IDs", () => {
    const report = rollupIdeasMetrics({
      cycle_snapshots: [
        snapshot({
          cycle_id: "cycle-020",
          root_event_ids: ["root-1", "root-1", "root-2"],
          root_event_count: 99,
          candidate_count: 2,
          admitted_cluster_count: 1,
        }),
        snapshot({
          cycle_id: "cycle-021",
          root_event_ids: [],
          root_event_count: 2,
          candidate_count: 1,
          admitted_cluster_count: 1,
        }),
      ],
      queue_entries: [],
      now: new Date("2026-02-25T00:00:00.000Z"),
    });

    expect(report.root_event_count).toBe(4);
    expect(report.fan_out_raw).toBe(0.75);
    expect(report.fan_out_admitted).toBe(0.5);
  });

  it("TC-10-04: reconciles shadow + enforced snapshots without double counting", () => {
    const report = rollupIdeasMetrics({
      cycle_snapshots: [
        snapshot({
          cycle_id: "cycle-030",
          phase: "P1",
          mode: "shadow",
          root_event_count: 10,
          candidate_count: 10,
          admitted_cluster_count: 5,
          root_event_ids: undefined,
        }),
        snapshot({
          cycle_id: "cycle-030",
          phase: "P1",
          mode: "enforced",
          root_event_ids: ["root-x", "root-y"],
          candidate_count: 2,
          admitted_cluster_count: 1,
        }),
        snapshot({
          cycle_id: "cycle-031",
          phase: "P1",
          mode: "shadow",
          root_event_count: 4,
          root_event_ids: undefined,
          candidate_count: 3,
          admitted_cluster_count: 1,
        }),
      ],
      queue_entries: [],
      now: new Date("2026-02-25T00:00:00.000Z"),
    });

    expect(report.cycle_count).toBe(2);
    expect(report.root_event_count).toBe(6);
    expect(report.candidate_count).toBe(5);
    expect(report.admitted_cluster_count).toBe(2);
    expect(report.provenance.reconciled_cycles[0]).toMatchObject({
      cycle_id: "cycle-030",
      selected_mode: "enforced",
      shadow_present: true,
      enforced_present: true,
      candidate_count: 2,
      admitted_cluster_count: 1,
    });
    expect(report.provenance.shadow_cycle_count).toBe(1);
    expect(report.provenance.enforced_cycle_count).toBe(1);
  });
});
