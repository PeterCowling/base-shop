// apps/telemetry-worker/src/validation.ts
// i18n-exempt file -- OPS-000 [ttl=2025-12-31]: machine-facing validation diagnostics

import type { TelemetryEvent } from "./types";

interface ValidationResult {
  valid: boolean;
  error?: string;
}

const MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB
const MAX_EVENTS_PER_BATCH = 100;

export function validateEvents(events: unknown[]): ValidationResult {
  // Check batch size
  if (events.length === 0) {
    return { valid: false, error: "Empty event array" };
  }

  if (events.length > MAX_EVENTS_PER_BATCH) {
    return {
      valid: false,
      error: `Too many events (max ${MAX_EVENTS_PER_BATCH})`,
    };
  }

  // Estimate payload size
  const payloadSize = JSON.stringify(events).length;
  if (payloadSize > MAX_PAYLOAD_SIZE) {
    return {
      valid: false,
      error: `Payload too large (max ${MAX_PAYLOAD_SIZE} bytes)`,
    };
  }

  // Validate each event shape
  for (let i = 0; i < events.length; i++) {
    const event = events[i] as TelemetryEvent;

    if (!event || typeof event !== "object") {
      return { valid: false, error: `Event ${i} is not an object` };
    }

    if (!event.name || typeof event.name !== "string") {
      return { valid: false, error: `Event ${i} missing required field: name` };
    }

    if (!event.ts || typeof event.ts !== "number") {
      return {
        valid: false,
        error: `Event ${i} missing required field: ts (ms since epoch)`,
      };
    }

    // Validate optional enums
    if (event.kind && !["event", "error"].includes(event.kind)) {
      return {
        valid: false,
        error: `Event ${i} has invalid kind (must be "event" or "error")`,
      };
    }

    if (
      event.level &&
      !["info", "warning", "error", "fatal"].includes(event.level)
    ) {
      return {
        valid: false,
        error: `Event ${i} has invalid level`,
      };
    }
  }

  return { valid: true };
}
