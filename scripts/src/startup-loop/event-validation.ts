/**
 * Event stream validation (LPSP-04B).
 *
 * Validates events.jsonl entries for schema compliance, required fields,
 * and structural integrity. Detects common corruption patterns.
 *
 * @see docs/business-os/startup-loop/event-state-schema.md
 */

import type { RunEvent } from "./derive-state";

// -- Types --

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  eventsChecked: number;
}

// -- Constants --

const VALID_EVENT_TYPES = new Set([
  "stage_started",
  "stage_completed",
  "stage_blocked",
  "run_aborted",
]);

const REQUIRED_FIELDS: (keyof RunEvent)[] = [
  "schema_version",
  "event",
  "run_id",
  "stage",
  "timestamp",
  "loop_spec_version",
];

// -- Validation --

/**
 * Validate an array of parsed events for schema compliance.
 *
 * For raw line-by-line validation (e.g., detecting truncated JSON),
 * parse each line individually and call this with the successfully
 * parsed events plus record parse errors separately.
 */
export function validateEventStream(events: RunEvent[]): ValidationResult {
  const errors: string[] = [];

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const lineRef = `event[${i}]`;

    // Required fields
    for (const field of REQUIRED_FIELDS) {
      if (event[field] === undefined || event[field] === null) {
        errors.push(`${lineRef}: missing required field '${field}'`);
      }
    }

    // Schema version
    if (event.schema_version !== undefined && event.schema_version !== 1) {
      errors.push(
        `${lineRef}: unsupported schema_version ${event.schema_version} (expected 1)`,
      );
    }

    // Event type
    if (event.event !== undefined && !VALID_EVENT_TYPES.has(event.event)) {
      errors.push(
        `${lineRef}: invalid event type '${event.event}'`,
      );
    }

    // Conditional field requirements
    if (event.event === "stage_completed") {
      if (!event.artifacts || Object.keys(event.artifacts).length === 0) {
        errors.push(
          `${lineRef}: stage_completed requires non-empty artifacts`,
        );
      }
    }

    if (event.event === "stage_blocked") {
      if (!event.blocking_reason) {
        errors.push(
          `${lineRef}: stage_blocked requires blocking_reason`,
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    eventsChecked: events.length,
  };
}

/**
 * Parse raw JSONL content into events, collecting parse errors.
 *
 * Returns both successfully parsed events and any line-level errors
 * (e.g., truncated JSON, invalid characters).
 */
export function parseEventStream(
  content: string,
): { events: RunEvent[]; parseErrors: string[] } {
  const lines = content.trim().split("\n").filter(Boolean);
  const events: RunEvent[] = [];
  const parseErrors: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    try {
      events.push(JSON.parse(lines[i]) as RunEvent);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      parseErrors.push(`line ${i + 1}: JSON parse error — ${msg}`);
    }
  }

  return { events, parseErrors };
}
