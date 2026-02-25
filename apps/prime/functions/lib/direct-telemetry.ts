interface DirectTelemetryEnv {
  RATE_LIMIT?: KVNamespace;
}

const TELEMETRY_RETENTION_SECONDS = 35 * 24 * 60 * 60;
export const DIRECT_TELEMETRY_RETENTION_SECONDS = TELEMETRY_RETENTION_SECONDS;

export const DIRECT_TELEMETRY_METRICS = [
  'read.success',
  'read.rate_limited',
  'read.denied_booking_mismatch',
  'read.denied_membership',
  'read.error',
  'write.success',
  'write.rate_limited',
  'write.denied_booking_mismatch',
  'write.denied_channel_mismatch',
  'write.denied_not_confirmed_guests',
  'write.denied_policy',
  'write.denied_channel_meta_conflict',
  'write.error',
] as const;

function parseCounter(raw: string | null): number {
  if (!raw) {
    return 0;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function buildDayBucket(nowMs: number): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

export function buildDirectTelemetryKey(metric: string, dayBucket: string): string {
  return `direct-telemetry:${metric}:${dayBucket}`;
}

export async function recordDirectTelemetry(
  env: DirectTelemetryEnv,
  metric: string,
): Promise<void> {
  if (!env.RATE_LIMIT) {
    return;
  }

  try {
    const key = buildDirectTelemetryKey(metric, buildDayBucket(Date.now()));
    const current = parseCounter(await env.RATE_LIMIT.get(key));
    await env.RATE_LIMIT.put(key, String(current + 1), {
      expirationTtl: TELEMETRY_RETENTION_SECONDS,
    });
  } catch {
    // Telemetry must never interfere with endpoint behavior.
  }
}
