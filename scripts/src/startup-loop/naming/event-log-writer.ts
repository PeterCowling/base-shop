import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

export type SidecarStage = 'generated' | 'i_gate_eliminated' | 'rdap_checked' | 'shortlisted' | 'finalist' | 'tm_prescreened';

/**
 * TM pre-screen direction record for product naming pipeline.
 * Populated by tm-prescreen-cli.ts. operator_result is null until the operator
 * manually checks the search URLs and records the result.
 */
export interface TmPrescreenRecord {
  euipo_url: string;                                         // Pre-filled EUIPO eTMview search URL
  wipo_url: string;                                          // Pre-filled WIPO Global Brand Database URL
  uibm_url: string;                                          // UIBM (Italian national register) URL
  classes: number[];                                         // Nice Classification classes searched (e.g., [25, 26])
  operator_result: 'clear' | 'conflict' | 'pending' | null; // Filled in by operator after manual check
}

export interface CandidateRecord {
  name: string;
  pattern: 'A' | 'B' | 'C' | 'D' | 'E';
  domain_string: string | null;
  provenance: string | null;
  scores: {
    D: number;
    W: number;
    P: number;
    E: number;
    I: number;
    total: number;
  } | null;
}

export interface RdapRecord {
  status: 'available' | 'taken' | 'unknown';
  statusCode: number | null;
  retries: number;
  latencyMs: number;
}

export interface ModelOutput {
  p_viable: number;
  ci90_lower: number;
  ci90_upper: number;
  model_version: string;
}

export interface SidecarEvent {
  schema_version: 'v1';
  event_id: string;
  business: string;
  round: number;
  run_date: string;       // YYYY-MM-DD
  stage: SidecarStage;
  candidate: CandidateRecord;
  rdap: RdapRecord | null;
  model_output: ModelOutput | null;
  tm_prescreen?: TmPrescreenRecord | null; // Populated by tm-prescreen-cli.ts; null/absent for company naming events
  timestamp: string;      // ISO datetime
}

const VALID_STAGES = new Set<SidecarStage>([
  'generated',
  'i_gate_eliminated',
  'rdap_checked',
  'shortlisted',
  'finalist',
  'tm_prescreened',
]);

const VALID_PATTERNS = new Set<string>(['A', 'B', 'C', 'D', 'E']);

/**
 * Validate a sidecar event against the schema (without Ajv — manual check).
 */
export function validateSidecarEvent(event: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof event !== 'object' || event === null || Array.isArray(event)) {
    errors.push('event must be a non-null object');
    return { valid: false, errors };
  }

  const rec = event as Record<string, unknown>;

  // schema_version
  if (rec['schema_version'] !== 'v1') {
    errors.push('schema_version must be "v1"');
  }

  // event_id
  if (typeof rec['event_id'] !== 'string' || rec['event_id'].length === 0) {
    errors.push('event_id is required and must be a non-empty string');
  }

  // business
  if (typeof rec['business'] !== 'string' || rec['business'].length === 0) {
    errors.push('business is required and must be a non-empty string');
  }

  // round
  if (typeof rec['round'] !== 'number' || !Number.isInteger(rec['round']) || (rec['round'] as number) < 1) {
    errors.push('round must be an integer >= 1');
  }

  // run_date
  if (typeof rec['run_date'] !== 'string' || rec['run_date'].length === 0) {
    errors.push('run_date is required and must be a non-empty string');
  }

  // stage
  if (typeof rec['stage'] !== 'string') {
    errors.push('stage is required and must be a string');
  } else if (!VALID_STAGES.has(rec['stage'] as SidecarStage)) {
    errors.push(
      `stage must be one of: ${[...VALID_STAGES].join(', ')} (got "${rec['stage']}")`
    );
  }

  // candidate
  if (typeof rec['candidate'] !== 'object' || rec['candidate'] === null || Array.isArray(rec['candidate'])) {
    errors.push('candidate is required and must be a non-null object');
  } else {
    const cand = rec['candidate'] as Record<string, unknown>;

    if (typeof cand['name'] !== 'string' || cand['name'].length === 0) {
      errors.push('candidate.name is required and must be a non-empty string');
    }

    if (typeof cand['pattern'] !== 'string' || !VALID_PATTERNS.has(cand['pattern'] as string)) {
      errors.push(`candidate.pattern must be one of: A, B, C, D, E (got "${cand['pattern']}")`);
    }

    // scores (optional, but if present validate dimensions)
    if (cand['scores'] !== null && cand['scores'] !== undefined) {
      const scores = cand['scores'] as Record<string, unknown>;
      for (const dim of ['D', 'W', 'P', 'E', 'I']) {
        const val = scores[dim];
        if (typeof val !== 'number' || !Number.isInteger(val) || val < 1 || val > 5) {
          errors.push(`candidate.scores.${dim} must be an integer between 1 and 5`);
        }
      }
      const total = scores['total'];
      if (typeof total !== 'number' || !Number.isInteger(total) || total < 5 || total > 25) {
        errors.push('candidate.scores.total must be an integer between 5 and 25');
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Get the canonical sidecar file path for a round.
 * Returns: <sidecarDir>/<runDate>-round-<N>.jsonl
 */
export function getSidecarFilePath(
  sidecarDir: string,
  runDate: string,
  round: number
): string {
  return path.join(sidecarDir, `${runDate}-round-${round}.jsonl`);
}

/**
 * Write one sidecar event to the JSONL file (appends).
 * File is created if it does not exist.
 */
export function writeSidecarEvent(
  event: SidecarEvent,
  sidecarDir: string,
  options?: { mkdirIfMissing?: boolean }
): void {
  if (options?.mkdirIfMissing) {
    fs.mkdirSync(sidecarDir, { recursive: true });
  }

  const filePath = getSidecarFilePath(sidecarDir, event.run_date, event.round);
  const line = JSON.stringify(event) + '\n';
  fs.appendFileSync(filePath, line, 'utf8');
}

/**
 * Read all events from a sidecar JSONL file.
 */
export function readSidecarEvents(filePath: string): SidecarEvent[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter((line) => line.trim().length > 0);
  const events: SidecarEvent[] = [];

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as SidecarEvent;
      events.push(parsed);
    } catch {
      // Skip malformed lines
    }
  }

  return events;
}

/**
 * Generate a new UUID v4 event ID.
 */
export function generateEventId(): string {
  return crypto.randomUUID();
}
