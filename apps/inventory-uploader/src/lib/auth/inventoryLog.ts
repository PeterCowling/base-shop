export type InventoryLogLevel = "info" | "warn" | "error";

const consoleFn: Record<InventoryLogLevel, (msg: string) => void> = {
  info: (msg) => console.info(msg),
  warn: (msg) => console.warn(msg),
  error: (msg) => console.error(msg),
};

/**
 * Minimal structured logger for inventory-uploader.
 *
 * Emits JSON-line records via the appropriate console method so that
 * `wrangler tail --format json` can parse them as structured events.
 *
 * Usage:
 *   inventoryLog("info", "import_start", { shop: "my-shop", rows: 42 });
 *
 * Output sample:
 *   {"level":"info","event":"import_start","ts":"2026-03-13T12:00:00.000Z","shop":"my-shop"}
 */
export function inventoryLog(
  level: InventoryLogLevel,
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
