import pino from "pino";

export interface LogMeta {
  [key: string]: unknown;
}

const level =
  process.env.LOG_LEVEL ??
  (process.env.NODE_ENV === "production" ? "info" : "debug");

const baseLogger = pino({ level });

export const logger = {
  error(message: string, meta: LogMeta = {}) {
    baseLogger.error(meta, message);
  },
  warn(message: string, meta: LogMeta = {}) {
    baseLogger.warn(meta, message);
  },
  info(message: string, meta: LogMeta = {}) {
    baseLogger.info(meta, message);
  },
  debug(message: string, meta: LogMeta = {}) {
    baseLogger.debug(meta, message);
  },
};
