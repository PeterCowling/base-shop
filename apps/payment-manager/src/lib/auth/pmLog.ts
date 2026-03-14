export type PmLogLevel = "info" | "warn" | "error";

const consoleFn: Record<PmLogLevel, (msg: string) => void> = {
  info: (msg) => console.info(msg),
  warn: (msg) => console.warn(msg),
  error: (msg) => console.error(msg),
};

/**
 * Minimal structured logger for payment-manager.
 *
 * Emits JSON-line records via the appropriate console method so that
 * `wrangler tail --format json` can parse them as structured events.
 *
 * Usage:
 *   pmLog("info", "refund_initiated", { shopId: "caryina", orderId: "xxx" });
 *
 * Output sample:
 *   {"level":"info","event":"refund_initiated","ts":"2026-03-13T12:00:00.000Z","shopId":"caryina"}
 */
export function pmLog(
  level: PmLogLevel,
  event: string,
  context?: Record<string, unknown>,
): void {
  // Skip all logging in test environment to prevent polluting test output.
  if (process.env.NODE_ENV === "test") return;

  const record: Record<string, unknown> = {
    level,
    event,
    ts: new Date().toISOString(),
    ...context,
  };

  const emit = consoleFn[level];

  try {
    emit(JSON.stringify(record));
  } catch {
    // Fallback for non-serializable context values: emit minimal record only.
    try {
      emit(JSON.stringify({ level, event, ts: record["ts"] }));
    } catch {
      // Nothing to do — even the minimal record failed.
    }
  }
}
