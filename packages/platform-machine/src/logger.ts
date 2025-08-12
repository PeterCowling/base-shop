type LogLevel = "debug" | "info" | "error";
const levels: Record<LogLevel, number> = { debug: 10, info: 20, error: 30 } as const;
const envLevel = (process.env.DEPOSIT_RELEASE_LOG_LEVEL || process.env.LOG_LEVEL || "info") as LogLevel;
const currentLevel = levels[envLevel] ?? levels.info;

function serialize(meta?: Record<string, unknown>) {
  if (!meta) return undefined;
  const result: Record<string, unknown> = { ...meta };
  const err = (meta as any).error;
  if (err instanceof Error) {
    result.error = { message: err.message, stack: err.stack };
  }
  return result;
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (levels[level] < currentLevel) return;
  const payload = { level, message, ...serialize(meta) };
  const text = JSON.stringify(payload);
  if (level === "error") console.error(text);
  else console.log(text);
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) =>
    log("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) =>
    log("info", message, meta),
  error: (message: string, meta?: Record<string, unknown>) =>
    log("error", message, meta),
};
