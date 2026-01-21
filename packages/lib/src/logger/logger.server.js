import "server-only";
import pino from "pino";
import { getRequestContext } from "../context/requestContext.server";
const level = process.env.LOG_LEVEL ??
    (process.env.NODE_ENV === "production" ? "info" : "debug");
const baseLogger = pino({ level });
function withContext(meta) {
    const ctx = getRequestContext();
    if (!ctx)
        return meta;
    return { ...ctx, ...meta };
}
export const logger = {
    error(message, meta = {}) {
        baseLogger.error(withContext(meta), message);
    },
    warn(message, meta = {}) {
        baseLogger.warn(withContext(meta), message);
    },
    info(message, meta = {}) {
        baseLogger.info(withContext(meta), message);
    },
    debug(message, meta = {}) {
        baseLogger.debug(withContext(meta), message);
    },
};
