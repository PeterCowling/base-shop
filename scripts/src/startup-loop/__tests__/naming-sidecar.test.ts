import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import { extractBaselineMetrics } from '../naming/baseline-extractor';
import {
  generateEventId,
  getSidecarFilePath,
  readSidecarEvents,
  type SidecarEvent,
  validateSidecarEvent,
  writeSidecarEvent,
} from '../naming/event-log-writer';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeGeneratedEvent(overrides: Partial<SidecarEvent> = {}): SidecarEvent {
  return {
    schema_version: 'v1',
    event_id: generateEventId(),
    business: 'TEST',
    round: 1,
    run_date: '2026-02-21',
    stage: 'generated',
    candidate: {
      name: 'Acmefy',
      pattern: 'A',
      domain_string: 'acmefy.com',
      provenance: null,
      scores: { D: 4, W: 3, P: 4, E: 3, I: 4, total: 18 },
    },
    rdap: null,
    model_output: null,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// TC-01: Schema rejects malformed records
// ---------------------------------------------------------------------------

describe('TC-01: validateSidecarEvent — schema rejects malformed records', () => {
  it('rejects a record missing the required "stage" field', () => {
    const badEvent = {
      schema_version: 'v1',
      event_id: 'abc-123',
      business: 'TEST',
      round: 1,
      run_date: '2026-02-21',
      // stage is intentionally absent
      candidate: {
        name: 'Acmefy',
        pattern: 'A',
        domain_string: null,
        provenance: null,
        scores: null,
      },
      rdap: null,
      model_output: null,
      timestamp: new Date().toISOString(),
    };

    const result = validateSidecarEvent(badEvent);
    expect(result.valid).toBe(false);
    const stageError = result.errors.find((e) => e.toLowerCase().includes('stage'));
    expect(stageError).toBeDefined();
  });

  it('rejects an invalid stage enum value', () => {
    const badEvent = makeGeneratedEvent({ stage: 'invalid_stage' as never });
    const result = validateSidecarEvent(badEvent);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('stage'))).toBe(true);
  });

  it('rejects a non-object event', () => {
    const result = validateSidecarEvent('not-an-object');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects a record with wrong schema_version', () => {
    const badEvent = makeGeneratedEvent({ schema_version: 'v2' as never });
    const result = validateSidecarEvent(badEvent);
    expect(result.valid).toBe(false);
  });

  it('rejects a record with an invalid candidate.pattern', () => {
    const badEvent = makeGeneratedEvent({
      candidate: { ...makeGeneratedEvent().candidate, pattern: 'Z' as never },
    });
    const result = validateSidecarEvent(badEvent);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('pattern'))).toBe(true);
  });

  it('rejects a record with scores out of range', () => {
    const badEvent = makeGeneratedEvent({
      candidate: {
        name: 'Test',
        pattern: 'A',
        domain_string: null,
        provenance: null,
        scores: { D: 6, W: 3, P: 3, E: 3, I: 3, total: 18 }, // D out of range
      },
    });
    const result = validateSidecarEvent(badEvent);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('D'))).toBe(true);
  });

  it('accepts a fully valid event', () => {
    const goodEvent = makeGeneratedEvent();
    const result = validateSidecarEvent(goodEvent);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// TC-02: End-to-end run emits sidecars and aggregate metrics
// ---------------------------------------------------------------------------

describe('TC-02: end-to-end write + extractBaselineMetrics', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'naming-sidecar-tc02-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('aggregates 3 generated + 1 i_gate_eliminated + 2 rdap_checked + 1 shortlisted', () => {
    const sidecarDir = path.join(tempDir, 'naming-sidecars');

    // Write 3 generated events
    for (let i = 0; i < 3; i++) {
      writeSidecarEvent(
        makeGeneratedEvent({ event_id: generateEventId(), candidate: { ...makeGeneratedEvent().candidate, name: `Name${i}` } }),
        sidecarDir,
        { mkdirIfMissing: true }
      );
    }

    // Write 1 i_gate_eliminated event
    writeSidecarEvent(
      makeGeneratedEvent({ stage: 'i_gate_eliminated' }),
      sidecarDir
    );

    // Write 2 rdap_checked events: 1 available, 1 taken
    writeSidecarEvent(
      makeGeneratedEvent({
        stage: 'rdap_checked',
        rdap: { status: 'available', statusCode: 404, retries: 0, latencyMs: 120 },
      }),
      sidecarDir
    );
    writeSidecarEvent(
      makeGeneratedEvent({
        stage: 'rdap_checked',
        rdap: { status: 'taken', statusCode: 200, retries: 0, latencyMs: 80 },
      }),
      sidecarDir
    );

    // Write 1 shortlisted event
    writeSidecarEvent(
      makeGeneratedEvent({ stage: 'shortlisted' }),
      sidecarDir
    );

    // Read back and verify
    const metrics = extractBaselineMetrics(sidecarDir);

    expect(metrics.n_generated).toBe(3);
    expect(metrics.n_i_gate_eliminated).toBe(1);
    expect(metrics.n_rdap_available).toBe(1);
    expect(metrics.n_rdap_taken).toBe(1);
    expect(metrics.n_rdap_unknown).toBe(0);
    expect(metrics.n_shortlisted).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// TC-03: Legacy shortlist markdown parity (additive-only check)
// ---------------------------------------------------------------------------

describe('TC-03: sidecar writer is purely additive — no .md files created', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'naming-sidecar-tc03-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('writes only .jsonl files — no .md files in sidecarDir', () => {
    const sidecarDir = path.join(tempDir, 'naming-sidecars');

    writeSidecarEvent(makeGeneratedEvent(), sidecarDir, { mkdirIfMissing: true });

    const files = fs.readdirSync(sidecarDir);
    const mdFiles = files.filter((f) => f.endsWith('.md'));
    expect(mdFiles).toHaveLength(0);

    const jsonlFiles = files.filter((f) => f.endsWith('.jsonl'));
    expect(jsonlFiles.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// TC-04: Replay parser reads sidecars from at least two rounds
// ---------------------------------------------------------------------------

describe('TC-04: multi-round replay', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'naming-sidecar-tc04-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('aggregates events across round 1 (2026-02-21) and round 2 (2026-02-22)', () => {
    const sidecarDir = path.join(tempDir, 'naming-sidecars');
    fs.mkdirSync(sidecarDir, { recursive: true });

    // Round 1: 2 generated events
    writeSidecarEvent(
      makeGeneratedEvent({ round: 1, run_date: '2026-02-21', event_id: generateEventId(), candidate: { ...makeGeneratedEvent().candidate, name: 'Alpha' } }),
      sidecarDir
    );
    writeSidecarEvent(
      makeGeneratedEvent({ round: 1, run_date: '2026-02-21', event_id: generateEventId(), candidate: { ...makeGeneratedEvent().candidate, name: 'Beta' } }),
      sidecarDir
    );

    // Round 2: 3 generated events
    writeSidecarEvent(
      makeGeneratedEvent({ round: 2, run_date: '2026-02-22', event_id: generateEventId(), candidate: { ...makeGeneratedEvent().candidate, name: 'Gamma' } }),
      sidecarDir
    );
    writeSidecarEvent(
      makeGeneratedEvent({ round: 2, run_date: '2026-02-22', event_id: generateEventId(), candidate: { ...makeGeneratedEvent().candidate, name: 'Delta' } }),
      sidecarDir
    );
    writeSidecarEvent(
      makeGeneratedEvent({ round: 2, run_date: '2026-02-22', event_id: generateEventId(), candidate: { ...makeGeneratedEvent().candidate, name: 'Epsilon' } }),
      sidecarDir
    );

    const metrics = extractBaselineMetrics(sidecarDir);

    // Both rounds present
    expect(metrics.rounds).toContain(1);
    expect(metrics.rounds).toContain(2);

    // Two source files (one per round/date combination)
    expect(metrics.source_files).toHaveLength(2);

    // n_generated is sum across both rounds
    expect(metrics.n_generated).toBe(5);
  });

  it('getSidecarFilePath returns different paths for different rounds', () => {
    const sidecarDir = '/tmp/test-sidecars';
    const p1 = getSidecarFilePath(sidecarDir, '2026-02-21', 1);
    const p2 = getSidecarFilePath(sidecarDir, '2026-02-22', 2);

    expect(p1).toBe(path.join(sidecarDir, '2026-02-21-round-1.jsonl'));
    expect(p2).toBe(path.join(sidecarDir, '2026-02-22-round-2.jsonl'));
    expect(p1).not.toBe(p2);
  });
});

// ---------------------------------------------------------------------------
// Additional unit tests for readSidecarEvents
// ---------------------------------------------------------------------------

describe('readSidecarEvents', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'naming-sidecar-read-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns empty array for non-existent file', () => {
    const result = readSidecarEvents(path.join(tempDir, 'missing.jsonl'));
    expect(result).toEqual([]);
  });

  it('reads back events written by writeSidecarEvent', () => {
    const sidecarDir = path.join(tempDir, 'sidecars');
    const event = makeGeneratedEvent();
    writeSidecarEvent(event, sidecarDir, { mkdirIfMissing: true });

    const filePath = getSidecarFilePath(sidecarDir, event.run_date, event.round);
    const events = readSidecarEvents(filePath);

    expect(events).toHaveLength(1);
    expect(events[0].event_id).toBe(event.event_id);
    expect(events[0].stage).toBe('generated');
    expect(events[0].candidate.name).toBe('Acmefy');
  });

  it('appends multiple events to the same file', () => {
    const sidecarDir = path.join(tempDir, 'sidecars');
    fs.mkdirSync(sidecarDir, { recursive: true });

    const e1 = makeGeneratedEvent({ event_id: 'id-1', candidate: { ...makeGeneratedEvent().candidate, name: 'First' } });
    const e2 = makeGeneratedEvent({ event_id: 'id-2', stage: 'shortlisted', candidate: { ...makeGeneratedEvent().candidate, name: 'Second' } });

    writeSidecarEvent(e1, sidecarDir);
    writeSidecarEvent(e2, sidecarDir);

    const filePath = getSidecarFilePath(sidecarDir, e1.run_date, e1.round);
    const events = readSidecarEvents(filePath);

    expect(events).toHaveLength(2);
    expect(events[0].event_id).toBe('id-1');
    expect(events[1].event_id).toBe('id-2');
  });
});
