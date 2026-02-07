export type ActivationFunnelEventType =
  | 'lookup_success'
  | 'verify_success'
  | 'guided_step_complete'
  | 'arrival_mode_entered'
  | 'staff_lookup_used'
  | 'utility_action_used';

export interface ActivationFunnelEvent {
  type: ActivationFunnelEventType;
  sessionKey: string;
  ts: number;
  route?: string;
  variant?: string;
  stepId?: string;
  context?: Record<string, string | number | boolean | null>;
}

export interface ActivationFunnelEventInput {
  type: ActivationFunnelEventType;
  sessionKey: string;
  route?: string;
  variant?: string;
  stepId?: string;
  context?: Record<string, unknown>;
  ts?: number;
}

export interface ActivationFunnelAggregateOptions {
  activationStart: ActivationFunnelEventType;
  readinessComplete: ActivationFunnelEventType;
}

export interface WeeklyTrendPoint {
  weekStartIso: string;
  lookupSessions: number;
  readinessSessions: number;
  activationConversion: number;
}

export interface ActivationFunnelAggregate {
  counts: Record<ActivationFunnelEventType, number>;
  conversion: {
    lookupToVerify: number;
    verifyToReadiness: number;
    lookupToReadiness: number;
  };
  trends: {
    weekly: WeeklyTrendPoint[];
  };
}

const STORAGE_KEY = 'prime_activation_funnel_events.v1';
const MAX_STORED_EVENTS = 800;
const PII_KEY_PATTERN = /(email|first.?name|last.?name|phone|address|password|token)/i;

function normalizeContext(
  context: Record<string, unknown> | undefined,
): Record<string, string | number | boolean | null> | undefined {
  if (!context) {
    return undefined;
  }

  const sanitized: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(context)) {
    if (PII_KEY_PATTERN.test(key)) {
      continue;
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      sanitized[key] = value as string | number | boolean | null;
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

export function buildActivationFunnelEvent(
  input: ActivationFunnelEventInput,
): ActivationFunnelEvent {
  return {
    type: input.type,
    sessionKey: input.sessionKey,
    route: input.route,
    variant: input.variant,
    stepId: input.stepId,
    context: normalizeContext(input.context),
    ts: input.ts ?? Date.now(),
  };
}

function getStoredEvents(): ActivationFunnelEvent[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((candidate): candidate is ActivationFunnelEvent => {
      return (
        candidate !== null &&
        typeof candidate === 'object' &&
        typeof (candidate as ActivationFunnelEvent).type === 'string' &&
        typeof (candidate as ActivationFunnelEvent).sessionKey === 'string' &&
        typeof (candidate as ActivationFunnelEvent).ts === 'number'
      );
    });
  } catch {
    return [];
  }
}

function storeEvents(events: ActivationFunnelEvent[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  const bounded = events.slice(-MAX_STORED_EVENTS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bounded));
  } catch {
    // Best-effort analytics. Never break UX for storage failures.
  }
}

export function recordActivationFunnelEvent(
  input: ActivationFunnelEventInput,
): ActivationFunnelEvent {
  const event = buildActivationFunnelEvent(input);
  const existing = getStoredEvents();
  existing.push(event);
  storeEvents(existing);
  return event;
}

export function readActivationFunnelEvents(): ActivationFunnelEvent[] {
  return getStoredEvents();
}

export function clearActivationFunnelEvents(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
}

function toWeekStartIso(ts: number): string {
  const date = new Date(ts);
  date.setUTCHours(0, 0, 0, 0);
  const day = date.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + mondayOffset);
  return date.toISOString().slice(0, 10);
}

function ratio(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}

export function aggregateActivationFunnel(
  events: ActivationFunnelEvent[],
  options: ActivationFunnelAggregateOptions,
): ActivationFunnelAggregate {
  const counts: Record<ActivationFunnelEventType, number> = {
    lookup_success: 0,
    verify_success: 0,
    guided_step_complete: 0,
    arrival_mode_entered: 0,
    staff_lookup_used: 0,
    utility_action_used: 0,
  };

  const lookupSessions = new Set<string>();
  const verifySessions = new Set<string>();
  const readinessSessions = new Set<string>();

  const weeklyLookup = new Map<string, Set<string>>();
  const weeklyReadiness = new Map<string, Set<string>>();

  for (const event of events) {
    counts[event.type] += 1;
    const week = toWeekStartIso(event.ts);

    if (event.type === options.activationStart) {
      lookupSessions.add(event.sessionKey);
      if (!weeklyLookup.has(week)) {
        weeklyLookup.set(week, new Set<string>());
      }
      weeklyLookup.get(week)!.add(event.sessionKey);
    }

    if (event.type === 'verify_success') {
      verifySessions.add(event.sessionKey);
    }

    if (event.type === options.readinessComplete) {
      readinessSessions.add(event.sessionKey);
      if (!weeklyReadiness.has(week)) {
        weeklyReadiness.set(week, new Set<string>());
      }
      weeklyReadiness.get(week)!.add(event.sessionKey);
    }
  }

  const weekKeys = new Set<string>([
    ...weeklyLookup.keys(),
    ...weeklyReadiness.keys(),
  ]);
  const weekly = [...weekKeys]
    .sort()
    .map((weekStartIso) => {
      const lookupSet = weeklyLookup.get(weekStartIso) ?? new Set<string>();
      const readinessSet = weeklyReadiness.get(weekStartIso) ?? new Set<string>();
      return {
        weekStartIso,
        lookupSessions: lookupSet.size,
        readinessSessions: readinessSet.size,
        activationConversion: ratio(readinessSet.size, lookupSet.size),
      };
    });

  return {
    counts,
    conversion: {
      lookupToVerify: ratio(verifySessions.size, lookupSessions.size),
      verifyToReadiness: ratio(readinessSessions.size, verifySessions.size),
      lookupToReadiness: ratio(readinessSessions.size, lookupSessions.size),
    },
    trends: {
      weekly,
    },
  };
}
