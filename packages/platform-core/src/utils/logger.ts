export interface LogMeta {
  [key: string]: unknown;
}

type LogLevel = "error" | "warn" | "info" | "debug";

const levelPriority: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const envLevel = process.env.LOG_LEVEL as LogLevel | undefined;
const currentLevel = levelPriority[envLevel ?? "info"] ?? levelPriority.info;

function log(level: LogLevel, message: string, meta: LogMeta = {}) {
  if (levelPriority[level] <= currentLevel) {
    const output = { level, message, ...meta };
    switch (level) {
      case "error":
        console.error(output);
        break;
      case "warn":
        console.warn(output);
        break;
      case "debug":
        console.debug(output);
        break;
      default:
        console.info(output);
    }
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
