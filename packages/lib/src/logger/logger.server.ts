import "server-only";

import pino from "pino";

import { getRequestContext } from "../context/requestContext.server";

export interface LogMeta {
  [key: string]: unknown;
}

const level =
  process.env.LOG_LEVEL ??
  (process.env.NODE_ENV === "production" ? "info" : "debug");

const baseLogger = pino({ level });

function withContext(meta: LogMeta): LogMeta {
  const ctx = getRequestContext();
  if (!ctx) return meta;
  return { ...ctx, ...meta };
}

export const logger = {
  error(message: string, meta: LogMeta = {}) {
    baseLogger.error(withContext(meta), message);
  },
  warn(message: string, meta: LogMeta = {}) {
    baseLogger.warn(withContext(meta), message);
  },
  info(message: string, meta: LogMeta = {}) {
    baseLogger.info(withContext(meta), message);
  },
  debug(message: string, meta: LogMeta = {}) {
    baseLogger.debug(withContext(meta), message);
  },
};
