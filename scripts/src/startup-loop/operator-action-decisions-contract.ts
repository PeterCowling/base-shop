export const PROCESS_IMPROVEMENTS_OPERATOR_ACTION_LEDGER_PATH =
  "docs/business-os/process-improvements/operator-action-decisions.jsonl";

export const PROCESS_IMPROVEMENTS_OPERATOR_ACTION_DECISION_EVENT_SCHEMA_VERSION =
  "process-improvements.operator-action-decision.v1";

export type ProcessImprovementsOperatorActionDecisionType = "done" | "snooze";

export interface ProcessImprovementsOperatorActionDecisionState {
  decision: ProcessImprovementsOperatorActionDecisionType;
  decidedAt: string;
  snoozeUntil?: string;
}

export interface ProcessImprovementsOperatorActionDecisionEvent {
  schema_version: typeof PROCESS_IMPROVEMENTS_OPERATOR_ACTION_DECISION_EVENT_SCHEMA_VERSION;
  event_id: string;
  action_id: string;
  business: string;
  source_path: string;
  decision: ProcessImprovementsOperatorActionDecisionType;
  actor_id: string;
  actor_name: string;
  decided_at: string;
  snooze_until?: string;
}

function readNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

export function isProcessImprovementsOperatorActionDecisionType(
  value: unknown
): value is ProcessImprovementsOperatorActionDecisionType {
  return value === "done" || value === "snooze";
}

export function parseProcessImprovementsOperatorActionDecisionEvent(
  rawLine: string
): ProcessImprovementsOperatorActionDecisionEvent | null {
  if (rawLine.trim().length === 0) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawLine);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const record = parsed as Record<string, unknown>;
  const schemaVersion = readNonEmptyString(record.schema_version);
  const eventId = readNonEmptyString(record.event_id);
  const actionId = readNonEmptyString(record.action_id);
  const business = readNonEmptyString(record.business);
  const sourcePath = readNonEmptyString(record.source_path);
  const actorId = readNonEmptyString(record.actor_id);
  const actorName = readNonEmptyString(record.actor_name);
  const decidedAt = readNonEmptyString(record.decided_at);
  const decision = record.decision;

  if (
    schemaVersion !==
      PROCESS_IMPROVEMENTS_OPERATOR_ACTION_DECISION_EVENT_SCHEMA_VERSION ||
    !eventId ||
    !actionId ||
    !business ||
    !sourcePath ||
    !actorId ||
    !actorName ||
    !decidedAt ||
    !isProcessImprovementsOperatorActionDecisionType(decision)
  ) {
    return null;
  }

  const snoozeUntil = readNonEmptyString(record.snooze_until);
  if (decision === "snooze" && !snoozeUntil) {
    return null;
  }

  return {
    schema_version:
      PROCESS_IMPROVEMENTS_OPERATOR_ACTION_DECISION_EVENT_SCHEMA_VERSION,
    event_id: eventId,
    action_id: actionId,
    business,
    source_path: sourcePath,
    decision,
    actor_id: actorId,
    actor_name: actorName,
    decided_at: decidedAt,
    snooze_until: snoozeUntil,
  };
}

export function reduceProcessImprovementsOperatorActionDecisionEvents(
  events: readonly ProcessImprovementsOperatorActionDecisionEvent[]
): Map<string, ProcessImprovementsOperatorActionDecisionState> {
  const orderedEvents = [...events].sort((left, right) => {
    return (
      left.decided_at.localeCompare(right.decided_at) ||
      left.event_id.localeCompare(right.event_id)
    );
  });

  const reduced = new Map<string, ProcessImprovementsOperatorActionDecisionState>();

  for (const event of orderedEvents) {
    reduced.set(event.action_id, {
      decision: event.decision,
      decidedAt: event.decided_at,
      snoozeUntil: event.snooze_until,
    });
  }

  return reduced;
}
