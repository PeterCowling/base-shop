/**
 * BL-03: Deterministic bottleneck detector with upstream attribution
 *
 * Tests pure ranking function with:
 * - Direction-aware severity classification
 * - Upstream attribution (prefer primitive drivers over derived outcomes)
 * - Blocked-stage elevation (outranks all metric constraints)
 * - Deterministic tiebreakers (miss desc → upstream_priority_order asc → metric id lexical)
 */

import type { BottleneckDiagnosis,FunnelMetricsInput } from '../bottleneck-detector';
import { identifyBottleneck } from '../bottleneck-detector';

describe('identifyBottleneck', () => {
  // TC-01: Single clear bottleneck — CAC 80% worse → S6B/cac critical
  test('TC-01: identifies single clear bottleneck with critical severity', () => {
    const input: FunnelMetricsInput = {
      diagnosis_schema_version: 'v1',
      constraint_key_version: 'v1',
      metric_catalog_version: 'v1',
      funnel_metrics: {
        traffic: {
          target: 10000,
          actual: 9800,
          delta_pct: -2.0,
          miss: 0.02,
          stage: 'S6B',
          direction: 'higher_is_better',
          metric_class: 'primitive',
        },
        cvr: {
          target: 0.05,
          actual: 0.048,
          delta_pct: -4.0,
          miss: 0.04,
          stage: 'S3',
          direction: 'higher_is_better',
          metric_class: 'primitive',
        },
        aov: {
          target: 150,
          actual: 148,
          delta_pct: -1.33,
          miss: 0.013,
          stage: 'S2B',
          direction: 'higher_is_better',
          metric_class: 'primitive',
        },
        cac: {
          target: 50,
          actual: 90,
          delta_pct: 80.0,
          miss: 0.80,
          stage: 'S6B',
          direction: 'lower_is_better',
          metric_class: 'primitive',
        },
        orders: {
          target: 500,
          actual: 490,
          delta_pct: -2.0,
          miss: 0.02,
          stage: 'S10',
          direction: 'higher_is_better',
          metric_class: 'derived',
        },
        revenue: {
          target: 75000,
          actual: 72520,
          delta_pct: -3.31,
          miss: 0.033,
          stage: 'S10',
          direction: 'higher_is_better',
          metric_class: 'derived',
        },
      },
      blocked_stages: [],
      data_quality: {
        missing_targets: [],
        missing_actuals: [],
        excluded_metrics: [],
      },
      sources: {
        s3_forecast: 'forecast.json',
        s10_readout: 'readout.json',
        events: 'events.jsonl',
      },
    };

    const result: BottleneckDiagnosis = identifyBottleneck(input);

    expect(result.diagnosis_status).toBe('ok');
    expect(result.identified_constraint).not.toBeNull();
    expect(result.identified_constraint?.constraint_key).toBe('S6B/cac');
    expect(result.identified_constraint?.stage).toBe('S6B');
    expect(result.identified_constraint?.metric).toBe('cac');
    expect(result.identified_constraint?.severity).toBe('critical');
    expect(result.identified_constraint?.miss).toBe(0.80);
  });

  // TC-02: Equal miss tie — CAC 0.60 and CVR 0.60 → CVR wins by upstream priority (S3 < S6B)
  test('TC-02: applies upstream priority tiebreaker when misses are equal', () => {
    const input: FunnelMetricsInput = {
      diagnosis_schema_version: 'v1',
      constraint_key_version: 'v1',
      metric_catalog_version: 'v1',
      funnel_metrics: {
        traffic: {
          target: 10000,
          actual: 9900,
          delta_pct: -1.0,
          miss: 0.01,
          stage: 'S6B',
          direction: 'higher_is_better',
          metric_class: 'primitive',
        },
        cvr: {
          target: 0.05,
          actual: 0.02,
          delta_pct: -60.0,
          miss: 0.60,
          stage: 'S3',
          direction: 'higher_is_better',
          metric_class: 'primitive',
        },
        aov: {
          target: 150,
          actual: 148,
          delta_pct: -1.33,
          miss: 0.013,
          stage: 'S2B',
          direction: 'higher_is_better',
          metric_class: 'primitive',
        },
        cac: {
          target: 50,
          actual: 80,
          delta_pct: 60.0,
          miss: 0.60,
          stage: 'S6B',
          direction: 'lower_is_better',
          metric_class: 'primitive',
        },
        orders: {
          target: 500,
          actual: 490,
          delta_pct: -2.0,
          miss: 0.02,
          stage: 'S10',
          direction: 'higher_is_better',
          metric_class: 'derived',
        },
        revenue: {
          target: 75000,
          actual: 72520,
          delta_pct: -3.31,
          miss: 0.033,
          stage: 'S10',
          direction: 'higher_is_better',
          metric_class: 'derived',
        },
      },
      blocked_stages: [],
      data_quality: {
        missing_targets: [],
        missing_actuals: [],
        excluded_metrics: [],
      },
      sources: {
        s3_forecast: 'forecast.json',
        s10_readout: 'readout.json',
        events: 'events.jsonl',
      },
    };

    const result: BottleneckDiagnosis = identifyBottleneck(input);

    expect(result.diagnosis_status).toBe('ok');
    expect(result.identified_constraint).not.toBeNull();
    expect(result.identified_constraint?.constraint_key).toBe('S3/cvr');
    expect(result.identified_constraint?.severity).toBe('critical');
    expect(result.identified_constraint?.miss).toBe(0.60);
    // S3 precedes S6B in upstream_priority_order
  });

  // TC-03: No bottleneck — all within 4% → diagnosis_status="no_bottleneck", constraint=null
  test('TC-03: returns no_bottleneck when all metrics within threshold', () => {
    const input: FunnelMetricsInput = {
      diagnosis_schema_version: 'v1',
      constraint_key_version: 'v1',
      metric_catalog_version: 'v1',
      funnel_metrics: {
        traffic: {
          target: 10000,
          actual: 9800,
          delta_pct: -2.0,
          miss: 0.02,
          stage: 'S6B',
          direction: 'higher_is_better',
          metric_class: 'primitive',
        },
        cvr: {
          target: 0.05,
          actual: 0.048,
          delta_pct: -4.0,
          miss: 0.04,
          stage: 'S3',
          direction: 'higher_is_better',
          metric_class: 'primitive',
        },
        aov: {
          target: 150,
          actual: 148,
          delta_pct: -1.33,
          miss: 0.013,
          stage: 'S2B',
          direction: 'higher_is_better',
          metric_class: 'primitive',
        },
        cac: {
          target: 50,
          actual: 48,
          delta_pct: -4.0,
          miss: 0.0,
          stage: 'S6B',
          direction: 'lower_is_better',
          metric_class: 'primitive',
        },
        orders: {
          target: 500,
          actual: 490,
          delta_pct: -2.0,
          miss: 0.02,
          stage: 'S10',
          direction: 'higher_is_better',
          metric_class: 'derived',
        },
        revenue: {
          target: 75000,
          actual: 72520,
          delta_pct: -3.31,
          miss: 0.033,
          stage: 'S10',
          direction: 'higher_is_better',
          metric_class: 'derived',
        },
      },
      blocked_stages: [],
      data_quality: {
        missing_targets: [],
        missing_actuals: [],
        excluded_metrics: [],
      },
      sources: {
        s3_forecast: 'forecast.json',
        s10_readout: 'readout.json',
        events: 'events.jsonl',
      },
    };

    const result: BottleneckDiagnosis = identifyBottleneck(input);

    expect(result.diagnosis_status).toBe('no_bottleneck');
    expect(result.identified_constraint).toBeNull();
    expect(result.ranked_constraints).toEqual([]);
  });

  // TC-04: Stage blocked — S4 deps_blocked → critical key S4/stage_blocked/deps_blocked
  test('TC-04: identifies blocked stage as critical constraint', () => {
    const input: FunnelMetricsInput = {
      diagnosis_schema_version: 'v1',
      constraint_key_version: 'v1',
      metric_catalog_version: 'v1',
      funnel_metrics: {
        traffic: {
          target: 10000,
          actual: 9800,
          delta_pct: -2.0,
          miss: 0.02,
          stage: 'S6B',
          direction: 'higher_is_better',
          metric_class: 'primitive',
        },
        cvr: {
          target: 0.05,
          actual: 0.04,
          delta_pct: -20.0,
          miss: 0.20,
          stage: 'S3',
          direction: 'higher_is_better',
          metric_class: 'primitive',
        },
        aov: {
          target: 150,
          actual: 148,
          delta_pct: -1.33,
          miss: 0.013,
          stage: 'S2B',
          direction: 'higher_is_better',
          metric_class: 'primitive',
        },
        cac: {
          target: 50,
          actual: 48,
          delta_pct: -4.0,
          miss: 0.0,
          stage: 'S6B',
          direction: 'lower_is_better',
          metric_class: 'primitive',
        },
        orders: {
          target: 500,
          actual: null,
          delta_pct: null,
          miss: null,
          stage: 'S10',
          direction: 'higher_is_better',
          metric_class: 'derived',
        },
        revenue: {
          target: 75000,
          actual: null,
          delta_pct: null,
          miss: null,
          stage: 'S10',
          direction: 'higher_is_better',
          metric_class: 'derived',
        },
      },
      blocked_stages: [
        {
          stage: 'S4',
          reason_code: 'deps_blocked',
          blocking_reason: 'Missing S6B artifacts',
          timestamp: '2026-02-13T10:00:00Z',
        },
      ],
      data_quality: {
        missing_targets: [],
        missing_actuals: ['orders', 'revenue'],
        excluded_metrics: [],
      },
      sources: {
        s3_forecast: 'forecast.json',
        s10_readout: 'readout.json',
        events: 'events.jsonl',
      },
    };

    const result: BottleneckDiagnosis = identifyBottleneck(input);

    expect(result.diagnosis_status).toBe('ok');
    expect(result.identified_constraint).not.toBeNull();
    expect(result.identified_constraint?.constraint_key).toBe('S4/stage_blocked/deps_blocked');
    expect(result.identified_constraint?.constraint_type).toBe('stage_blocked');
    expect(result.identified_constraint?.stage).toBe('S4');
    expect(result.identified_constraint?.reason_code).toBe('deps_blocked');
    expect(result.identified_constraint?.severity).toBe('critical');
    expect(result.identified_constraint?.miss).toBe(1.0);
  });

  // TC-05: Minor miss — CVR miss 0.10 → severity "minor"
  test('TC-05: classifies moderate miss correctly', () => {
    const input: FunnelMetricsInput = {
      diagnosis_schema_version: 'v1',
      constraint_key_version: 'v1',
      metric_catalog_version: 'v1',
      funnel_metrics: {
        traffic: {
          target: 10000,
          actual: 9900,
          delta_pct: -1.0,
          miss: 0.01,
          stage: 'S6B',
          direction: 'higher_is_better',
          metric_class: 'primitive',
        },
        cvr: {
          target: 0.05,
          actual: 0.045,
          delta_pct: -10.0,
          miss: 0.10,
          stage: 'S3',
          direction: 'higher_is_better',
          metric_class: 'primitive',
        },
        aov: {
          target: 150,
          actual: 148,
          delta_pct: -1.33,
          miss: 0.013,
          stage: 'S2B',
          direction: 'higher_is_better',
          metric_class: 'primitive',
        },
        cac: {
          target: 50,
          actual: 48,
          delta_pct: -4.0,
          miss: 0.0,
          stage: 'S6B',
          direction: 'lower_is_better',
          metric_class: 'primitive',
        },
        orders: {
          target: 500,
          actual: 490,
          delta_pct: -2.0,
          miss: 0.02,
          stage: 'S10',
          direction: 'higher_is_better',
          metric_class: 'derived',
        },
        revenue: {
          target: 75000,
          actual: 73500,
          delta_pct: -2.0,
          miss: 0.02,
          stage: 'S10',
          direction: 'higher_is_better',
          metric_class: 'derived',
        },
      },
      blocked_stages: [],
      data_quality: {
        missing_targets: [],
        missing_actuals: [],
        excluded_metrics: [],
      },
      sources: {
        s3_forecast: 'forecast.json',
        s10_readout: 'readout.json',
        events: 'events.jsonl',
      },
    };

    const result: BottleneckDiagnosis = identifyBottleneck(input);

    expect(result.diagnosis_status).toBe('ok');
    expect(result.identified_constraint).not.toBeNull();
    expect(result.identified_constraint?.constraint_key).toBe('S3/cvr');
    expect(result.identified_constraint?.severity).toBe('minor');
    expect(result.identified_constraint?.miss).toBe(0.10);
  });

  // TC-06: Symptom guard — orders miss highest but traffic miss > cvr miss → traffic as primary
  test('TC-06: applies upstream attribution to prefer primitive driver over derived outcome', () => {
    const input: FunnelMetricsInput = {
      diagnosis_schema_version: 'v1',
      constraint_key_version: 'v1',
      metric_catalog_version: 'v1',
      funnel_metrics: {
        traffic: {
          target: 10000,
          actual: 7000,
          delta_pct: -30.0,
          miss: 0.30,
          stage: 'S6B',
          direction: 'higher_is_better',
          metric_class: 'primitive',
        },
        cvr: {
          target: 0.05,
          actual: 0.04,
          delta_pct: -20.0,
          miss: 0.20,
          stage: 'S3',
          direction: 'higher_is_better',
          metric_class: 'primitive',
        },
        aov: {
          target: 150,
          actual: 148,
          delta_pct: -1.33,
          miss: 0.013,
          stage: 'S2B',
          direction: 'higher_is_better',
          metric_class: 'primitive',
        },
        cac: {
          target: 50,
          actual: 48,
          delta_pct: -4.0,
          miss: 0.0,
          stage: 'S6B',
          direction: 'lower_is_better',
          metric_class: 'primitive',
        },
        orders: {
          target: 500,
          actual: 140,
          delta_pct: -72.0,
          miss: 0.72,
          stage: 'S10',
          direction: 'higher_is_better',
          metric_class: 'derived',
        },
        revenue: {
          target: 75000,
          actual: 20720,
          delta_pct: -72.37,
          miss: 0.724,
          stage: 'S10',
          direction: 'higher_is_better',
          metric_class: 'derived',
        },
      },
      blocked_stages: [],
      data_quality: {
        missing_targets: [],
        missing_actuals: [],
        excluded_metrics: [],
      },
      sources: {
        s3_forecast: 'forecast.json',
        s10_readout: 'readout.json',
        events: 'events.jsonl',
      },
    };

    const result: BottleneckDiagnosis = identifyBottleneck(input);

    expect(result.diagnosis_status).toBe('ok');
    expect(result.identified_constraint).not.toBeNull();
    // Traffic miss (0.30) > CVR miss (0.20), so traffic should be primary
    expect(result.identified_constraint?.constraint_key).toBe('S6B/traffic');
    expect(result.identified_constraint?.severity).toBe('moderate');
    expect(result.identified_constraint?.miss).toBe(0.30);
  });

  // TC-07: Ranked transparency — output includes top alternatives with misses
  test('TC-07: includes ranked alternatives in output', () => {
    const input: FunnelMetricsInput = {
      diagnosis_schema_version: 'v1',
      constraint_key_version: 'v1',
      metric_catalog_version: 'v1',
      funnel_metrics: {
        traffic: {
          target: 10000,
          actual: 8500,
          delta_pct: -15.0,
          miss: 0.15,
          stage: 'S6B',
          direction: 'higher_is_better',
          metric_class: 'primitive',
        },
        cvr: {
          target: 0.05,
          actual: 0.025,
          delta_pct: -50.0,
          miss: 0.50,
          stage: 'S3',
          direction: 'higher_is_better',
          metric_class: 'primitive',
        },
        aov: {
          target: 150,
          actual: 145,
          delta_pct: -3.33,
          miss: 0.033,
          stage: 'S2B',
          direction: 'higher_is_better',
          metric_class: 'primitive',
        },
        cac: {
          target: 50,
          actual: 45,
          delta_pct: -10.0,
          miss: 0.0,
          stage: 'S6B',
          direction: 'lower_is_better',
          metric_class: 'primitive',
        },
        orders: {
          target: 500,
          actual: 213,
          delta_pct: -57.4,
          miss: 0.574,
          stage: 'S10',
          direction: 'higher_is_better',
          metric_class: 'derived',
        },
        revenue: {
          target: 75000,
          actual: 30885,
          delta_pct: -58.82,
          miss: 0.588,
          stage: 'S10',
          direction: 'higher_is_better',
          metric_class: 'derived',
        },
      },
      blocked_stages: [],
      data_quality: {
        missing_targets: [],
        missing_actuals: [],
        excluded_metrics: [],
      },
      sources: {
        s3_forecast: 'forecast.json',
        s10_readout: 'readout.json',
        events: 'events.jsonl',
      },
    };

    const result: BottleneckDiagnosis = identifyBottleneck(input);

    expect(result.diagnosis_status).toBe('ok');
    expect(result.ranked_constraints.length).toBeGreaterThan(1);
    expect(result.ranked_constraints[0].constraint_key).toBe('S3/cvr');
    expect(result.ranked_constraints[0].rank).toBe(1);
    expect(result.ranked_constraints.every((c) => c.miss !== null)).toBe(true);
    expect(result.ranked_constraints.every((c) => c.reasoning)).toBeTruthy();
  });

  // TC-08: Insufficient data — no eligible metrics, no blocked → diagnosis_status="insufficient_data"
  test('TC-08: returns insufficient_data when no eligible metrics or blocked stages', () => {
    const input: FunnelMetricsInput = {
      diagnosis_schema_version: 'v1',
      constraint_key_version: 'v1',
      metric_catalog_version: 'v1',
      funnel_metrics: {
        traffic: {
          target: null,
          actual: null,
          delta_pct: null,
          miss: null,
          stage: 'S6B',
          direction: 'higher_is_better',
          metric_class: 'primitive',
        },
        cvr: {
          target: null,
          actual: null,
          delta_pct: null,
          miss: null,
          stage: 'S3',
          direction: 'higher_is_better',
          metric_class: 'primitive',
        },
        aov: {
          target: null,
          actual: null,
          delta_pct: null,
          miss: null,
          stage: 'S2B',
          direction: 'higher_is_better',
          metric_class: 'primitive',
        },
        cac: {
          target: null,
          actual: null,
          delta_pct: null,
          miss: null,
          stage: 'S6B',
          direction: 'lower_is_better',
          metric_class: 'primitive',
        },
        orders: {
          target: null,
          actual: null,
          delta_pct: null,
          miss: null,
          stage: 'S10',
          direction: 'higher_is_better',
          metric_class: 'derived',
        },
        revenue: {
          target: null,
          actual: null,
          delta_pct: null,
          miss: null,
          stage: 'S10',
          direction: 'higher_is_better',
          metric_class: 'derived',
        },
      },
      blocked_stages: [],
      data_quality: {
        missing_targets: ['traffic', 'cvr', 'aov', 'cac', 'orders', 'revenue'],
        missing_actuals: ['traffic', 'cvr', 'aov', 'cac', 'orders', 'revenue'],
        excluded_metrics: [],
      },
      sources: {
        s3_forecast: 'forecast.json',
        s10_readout: 'readout.json',
        events: 'events.jsonl',
      },
    };

    const result: BottleneckDiagnosis = identifyBottleneck(input);

    expect(result.diagnosis_status).toBe('insufficient_data');
    expect(result.identified_constraint).toBeNull();
    expect(result.ranked_constraints).toEqual([]);
  });

  // TC-09: Multiple blocked stages — choose primary by upstream_priority_order
  test('TC-09: selects earliest blocked stage by upstream priority order', () => {
    const input: FunnelMetricsInput = {
      diagnosis_schema_version: 'v1',
      constraint_key_version: 'v1',
      metric_catalog_version: 'v1',
      funnel_metrics: {
        traffic: {
          target: 10000,
          actual: 9900,
          delta_pct: -1.0,
          miss: 0.01,
          stage: 'S6B',
          direction: 'higher_is_better',
          metric_class: 'primitive',
        },
        cvr: {
          target: 0.05,
          actual: 0.049,
          delta_pct: -2.0,
          miss: 0.02,
          stage: 'S3',
          direction: 'higher_is_better',
          metric_class: 'primitive',
        },
        aov: {
          target: 150,
          actual: 148,
          delta_pct: -1.33,
          miss: 0.013,
          stage: 'S2B',
          direction: 'higher_is_better',
          metric_class: 'primitive',
        },
        cac: {
          target: 50,
          actual: 48,
          delta_pct: -4.0,
          miss: 0.0,
          stage: 'S6B',
          direction: 'lower_is_better',
          metric_class: 'primitive',
        },
        orders: {
          target: 500,
          actual: null,
          delta_pct: null,
          miss: null,
          stage: 'S10',
          direction: 'higher_is_better',
          metric_class: 'derived',
        },
        revenue: {
          target: 75000,
          actual: null,
          delta_pct: null,
          miss: null,
          stage: 'S10',
          direction: 'higher_is_better',
          metric_class: 'derived',
        },
      },
      blocked_stages: [
        {
          stage: 'S7',
          reason_code: 'data_missing',
          blocking_reason: 'Fact-find data unavailable',
          timestamp: '2026-02-13T10:30:00Z',
        },
        {
          stage: 'S4',
          reason_code: 'deps_blocked',
          blocking_reason: 'Missing S6B artifacts',
          timestamp: '2026-02-13T10:00:00Z',
        },
      ],
      data_quality: {
        missing_targets: [],
        missing_actuals: ['orders', 'revenue'],
        excluded_metrics: [],
      },
      sources: {
        s3_forecast: 'forecast.json',
        s10_readout: 'readout.json',
        events: 'events.jsonl',
      },
    };

    const result: BottleneckDiagnosis = identifyBottleneck(input);

    expect(result.diagnosis_status).toBe('ok');
    expect(result.identified_constraint).not.toBeNull();
    // S4 precedes S7 in upstream_priority_order
    expect(result.identified_constraint?.constraint_key).toBe('S4/stage_blocked/deps_blocked');
    expect(result.identified_constraint?.stage).toBe('S4');
    expect(result.identified_constraint?.severity).toBe('critical');
    expect(result.identified_constraint?.miss).toBe(1.0);

    // Verify S7 is in ranked constraints as secondary
    expect(result.ranked_constraints.length).toBeGreaterThanOrEqual(2);
    expect(result.ranked_constraints[1].constraint_key).toBe('S7/stage_blocked/data_missing');
  });
});
