export type UploaderLogLevel = "info" | "warn" | "error";

const consoleFn: Record<UploaderLogLevel, (msg: string) => void> = {
  info: (msg) => console.info(msg),
  warn: (msg) => console.warn(msg),
  error: (msg) => console.error(msg),
};

/**
 * Minimal structured logger for xa-uploader.
 *
 * Emits JSON-line records via the appropriate console method so that
 * `wrangler tail --format json` can parse them as structured events.
 * Compatible with both Node.js (server routes) and browser (client
 * components) runtimes — all console methods are universal.
 *
 * Usage:
 *   import { uploaderLog } from "@/lib/uploaderLogger";
 *   uploaderLog("info", "upload_start", { storefront: "xa", slug: "my-product" });
 *
 * Output sample:
 *   {"level":"info","event":"upload_start","ts":"2026-03-11T15:00:00.000Z","storefront":"xa"}
 */
export function uploaderLog(
  level: UploaderLogLevel,
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
