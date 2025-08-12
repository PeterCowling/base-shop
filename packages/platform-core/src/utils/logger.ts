export interface LogMeta {
  [key: string]: unknown;
}

type LogLevel = "error" | "warn" | "info" | "debug";

const PRIORITY: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const envLevel = (process.env.LOG_LEVEL || "info").toLowerCase();
const currentLevel = (envLevel in PRIORITY ? envLevel : "info") as LogLevel;

function log(level: LogLevel, message: string, meta: LogMeta = {}) {
  if (PRIORITY[level] <= PRIORITY[currentLevel]) {
    console[level]({ level, message, ...meta });
  }
}

export const logger = {
  error(message: string, meta: LogMeta = {}) {
    log("error", message, meta);
  },
  warn(message: string, meta: LogMeta = {}) {
    log("warn", message, meta);
  },
  info(message: string, meta: LogMeta = {}) {
    log("info", message, meta);
  },
  debug(message: string, meta: LogMeta = {}) {
    log("debug", message, meta);
  },
};
