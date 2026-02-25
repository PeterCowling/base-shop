/**
 * CF Pages Function: /api/direct-telemetry
 *
 * Staff-only endpoint for direct-message telemetry rollups.
 * Reads day-bucketed counters from KV and returns windowed totals.
 */

import { jsonResponse, errorResponse } from '../lib/firebase-rest';
import {
  buildDirectTelemetryKey,
  DIRECT_TELEMETRY_METRICS,
} from '../lib/direct-telemetry';
import { enforceStaffAuthTokenGate } from '../lib/staff-auth-token-gate';

interface Env {
  CF_FIREBASE_DATABASE_URL: string;
  CF_FIREBASE_API_KEY?: string;
  RATE_LIMIT?: KVNamespace;
  NODE_ENV?: string;
  PRIME_ENABLE_STAFF_OWNER_ROUTES?: string;
  PRIME_STAFF_OWNER_GATE_TOKEN?: string;
}

const DEFAULT_WINDOW_DAYS = 7;
const MAX_WINDOW_DAYS = 30;

function parseWindowDays(rawDays: string | null): number | null {
  if (!rawDays) {
    return DEFAULT_WINDOW_DAYS;
  }

  const parsed = Number.parseInt(rawDays, 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > MAX_WINDOW_DAYS) {
    return null;
  }

  return parsed;
}

function buildWindowDayBuckets(days: number, nowMs: number): string[] {
  const dayBuckets: string[] = [];
  const oneDayMs = 24 * 60 * 60 * 1000;
  const todayUtc = new Date(nowMs);
  todayUtc.setUTCHours(0, 0, 0, 0);

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(todayUtc.getTime() - offset * oneDayMs)
      .toISOString()
      .slice(0, 10);
    dayBuckets.push(day);
  }

  return dayBuckets;
}

function parseCounter(raw: string | null): number {
  if (!raw) {
    return 0;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const gateResult = await enforceStaffAuthTokenGate(request, env);
  if (!gateResult.ok) {
    return gateResult.response;
  }

  const url = new URL(request.url);
  const days = parseWindowDays(url.searchParams.get('days'));
  if (days === null) {
    return errorResponse(`days must be an integer between 1 and ${MAX_WINDOW_DAYS}`, 400);
  }

  if (!env.RATE_LIMIT) {
    return errorResponse('RATE_LIMIT KV binding is required for telemetry reads', 503);
  }

  const dayBuckets = buildWindowDayBuckets(days, Date.now());
  const totals = Object.fromEntries(DIRECT_TELEMETRY_METRICS.map((metric) => [metric, 0]));
  const byDay = Object.fromEntries(
    dayBuckets.map((day) => [day, Object.fromEntries(DIRECT_TELEMETRY_METRICS.map((metric) => [metric, 0]))]),
  );

  for (const day of dayBuckets) {
    for (const metric of DIRECT_TELEMETRY_METRICS) {
      const key = buildDirectTelemetryKey(metric, day);
      const count = parseCounter(await env.RATE_LIMIT.get(key));
      byDay[day][metric] = count;
      totals[metric] += count;
    }
  }

  return jsonResponse({
    requestedBy: gateResult.identity.uid,
    generatedAt: new Date().toISOString(),
    windowDays: days,
    dayBuckets,
    totals,
    byDay,
  });
};
